import { Effect } from "effect";
import { Address } from "../../../../messaging/base/address";
import { Middleware, useMiddleware } from "../../../../messaging/base/middleware";
import { PartitionMiddlewareKeys } from "../../../../messaging/middleware/partition";
import { callbackAsResult, CallbackError } from "../../../../utils/boundary/callbacks";
import { Failure, Result, ResultPromise, Success } from "../../../../utils/boundary/result";
import { registerDefaultEnvironmentMiddleware } from "../../../common_lib/env_communication/default_middleware";
import { KernelEnvironment } from "../kernel_env";
import { defaultMiddleware } from "./middleware/default";

export class ExternalReference {
    public is_removed = false;
    protected partitionMiddleware!: Effect.Effect.Success<ReturnType<typeof registerDefaultEnvironmentMiddleware>>;

    constructor(
        readonly address: Address,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Result<void, Error> | ResultPromise<void, Error> | Promise<void>,
        registerOwnMiddlewareMethod?: (mw: Middleware) => void
    ) {
        this.partitionMiddleware = defaultMiddleware();
        (registerOwnMiddlewareMethod || this.default_register_own_middleware).bind(this)(this.partitionMiddleware());
    }

    private default_register_own_middleware(mw: Middleware) {
        useMiddleware({
            middleware: mw,
            address: this.address
        }).pipe(
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore,
            Effect.runPromise
        );
    }

    useMiddleware(
        mw: Middleware,
        position: PartitionMiddlewareKeys<typeof this.partitionMiddleware>
    ) {
        this.partitionMiddleware[position].push(mw);
        return;
    }

    remove(): ResultPromise<void, Error> {
        if (this.is_removed) return Promise.resolve(
            Failure.from_error(new AggregateError(
                [new Error("Plugin already removed")],
                "Plugin already removed"
            ))
        );

        const r = callbackAsResult(this.on_remove)();
        this.is_removed = true;
        return r.then(r => {
            if (r instanceof CallbackError) {
                return Failure.from_error(r.error);
            }
            if (!r.is_error) {
                if (r.value instanceof Success || r.value instanceof Failure) {
                    return r.value;
                }
                return r as Success<void>;
            }

            return r;
        });
    }
}