import { Effect } from "effect";
import { ProtocolErrorN } from "../../../../messaging/protocols/base/protocol_errors";
import { EnvironmentT } from "../../../../pluginSystem/common_lib/messageEnvironments/environment";
import { callbackAsEffect } from "../../../../utils/boundary/callbacks";
import { Json } from "../../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../../common_lib/env_communication/EnvironmentCommunicationHandler";
import { PluginEnvironment } from "../plugin_env";

export function remove_self_impl(this: PluginEnvironment, data?: Json): Promise<void> {
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

export function __remove_cb_impl(data: Json): Promise<void> {
    return Promise.resolve();
}

export function on_remove_impl(this: PluginEnvironment, cb: (data: Json) => Promise<void>) {
    this.__remove_cb = cb;
}

export function register_remove_plugin_command(PEC: typeof PluginEnvironment) {
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

// Keep the original function for backward compatibility during transition
export default function (PEC: typeof PluginEnvironment) {
    register_remove_plugin_command(PEC);
}