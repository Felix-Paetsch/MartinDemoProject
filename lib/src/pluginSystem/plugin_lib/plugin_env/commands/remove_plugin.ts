import { Effect } from "effect";
import { ProtocolErrorN } from "../../../../messaging/protocols/base/protocol_errors";
import { EnvironmentT } from "../../../../pluginSystem/common_lib/messageEnvironments/environment";
import { callbackAsEffect } from "../../../../utils/boundary/callbacks";
import { Json } from "../../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../../common_lib/env_communication/EnvironmentCommunicationHandler";
import { PluginEnvironment } from "../plugin_env";

export default function (PEC: typeof PluginEnvironment) {
    PEC.prototype.remove_self = function (data?: Json): Promise<void> {
        return this._send_command(
            this.kernel_address,
            "remove_plugin_self",
            data,
            0
        ).pipe(
            Effect.provideService(EnvironmentT, this.env),
            Effect.as(void 0),
            Effect.runPromise
        );
    }

    PEC.prototype.__remove_cb = function (data: Json): Promise<void> {
        return Promise.resolve();
    }
    PEC.prototype.on_remove = function (cb: (data: Json) => Promise<void>) {
        this.__remove_cb = cb;
    }

    PEC.add_kernel_command({
        command: "remove_plugin",
        on_command: Effect.fn("remove plugin")(
            function* (
                communicator: PluginEnvironment,
                handler: EnvironmentCommunicationHandler,
                data: Json
            ) {
                yield* callbackAsEffect(communicator.__remove_cb)(data).pipe(
                    Effect.catchAll(e => handler.asErrorR(e))
                );
                yield* handler.close({ success: true }, true).pipe(
                    Effect.catchAll(e => ProtocolErrorN({
                        message: "Failed to close handler",
                        error: new Error(String(e))
                    }))
                );
            }
        )
    })
}