import { Effect, Either } from "effect";
import { Address } from "pc-messaging-kernel/messaging/base/address";
import { v4 as uuidv4 } from "uuid";
import { Middleware, useMiddleware } from "../../../../messaging/base/middleware";
import { PartitionMiddlewareKeys } from "../../../../messaging/middleware/partition";
import { callbackAsEffect } from "../../../../utils/boundary/callbacks";
import { Failure, Result, ResultPromise, Success } from "../../../../utils/boundary/result";
import { registerDefaultEnvironmentMiddleware } from "../../../common_lib/env_communication/default_middleware";
import { PluginIdent, PluginIdentWithInstanceId } from "../../../plugin_lib/plugin_env/plugin_ident";
import { KernelEnvironment } from "../kernel_env";
import { defaultMiddleware } from "./middleware/default";

export class PluginReference {
    public is_removed = false;
    readonly plugin_ident: PluginIdentWithInstanceId;
    protected partitionMiddleware!: Effect.Effect.Success<ReturnType<typeof registerDefaultEnvironmentMiddleware>>;

    constructor(
        readonly address: Address,
        plugin_ident: PluginIdent,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Result<void, Error> | ResultPromise<void, Error> | Promise<void>,
        registerOwnMiddlewareMethod?: (mw: Middleware) => void
    ) {
        this.plugin_ident = {
            instance_id: uuidv4(),
            ...plugin_ident
        };
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
        this.is_removed = true;

        return Effect.all([
            this.kernel._send_remove_plugin_message(this.address, this.plugin_ident),
            callbackAsEffect(this.on_remove)()
        ], {
            concurrency: 1,
            mode: "either"
        }).pipe(
            Effect.andThen(res => Effect.gen(function* () {
                const errors: Error[] = []
                if (Either.isLeft(res[0])) {
                    errors.push(res[0].left);
                }
                if (Either.isLeft(res[1])) {
                    errors.push(res[1].left);
                } else if (Either.isRight(res[1])) {
                    const r = res[1].right;
                    if (r instanceof Failure) {
                        errors.push(r.error);
                    }
                }
                if (errors.length > 0) {
                    return Failure.from_error(new AggregateError(errors, "Plugin removal failed"));
                }
                return new Success(undefined);
            })),
            Effect.runPromise
        )
    }
}