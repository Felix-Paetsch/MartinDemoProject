import { Effect, Either } from "effect";
import { v4 as uuidv4 } from "uuid";
import { Address } from "../../../../messaging/base/address";
import { Middleware } from "../../../../messaging/base/middleware";
import { PluginIdent, PluginIdentWithInstanceId } from "../../../../pluginSystem/plugin_lib/plugin_env/plugin_ident";
import { Failure, Result, ResultPromise, Success } from "../../../../utils/boundary/result";
import { ResultToEffect } from "../../../../utils/boundary/run";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";

export class PluginReference extends ExternalReference {
    readonly plugin_ident: PluginIdentWithInstanceId;

    constructor(
        readonly address: Address,
        plugin_ident: PluginIdent,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Result<void, Error> | ResultPromise<void, Error> | Promise<void>,
        registerOwnMiddlewareMethod?: (mw: Middleware) => void
    ) {
        super(address, kernel, on_remove, registerOwnMiddlewareMethod);
        this.plugin_ident = {
            instance_id: uuidv4(),
            ...plugin_ident
        };
    }

    remove(): ResultPromise<void, Error> {
        return Effect.all([
            this.kernel._send_remove_plugin_message(this.address, this.plugin_ident),
            ResultToEffect(super.remove())
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