import { Effect } from "effect";
import { Address } from "../../../../messaging/core/address";
import { Middleware, useMiddleware } from "../../../../messaging/core/middleware";
import { PartitionMiddlewareKeys } from "../../../../messaging/middlewares/partition";
import { registerDefaultEnvironmentMiddleware } from "../../../common_lib/environments/default_middleware";
import { KernelEnvironment } from "../kernel_env";
import { defaultMiddleware } from "./middleware/default";

export class ExternalReference {
    public is_removed = false;
    protected partitionMiddleware!: Effect.Effect.Success<ReturnType<typeof registerDefaultEnvironmentMiddleware>>;

    constructor(
        readonly address: Address,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void>,
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

    remove() {
        if (this.is_removed) return Promise.resolve();
        const r = this.on_remove();
        if (r instanceof Promise) {
            return r;
        }
        return Promise.resolve();
    }
}