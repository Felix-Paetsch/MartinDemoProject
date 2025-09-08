import { Effect, Schema } from "effect";
import { ResultToEffect } from "../../../../utils/boundary/run";
import { Json } from "../../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../../common_lib/env_communication/EnvironmentCommunicationHandler";

import { pluginIdentSchema } from "../../../plugin_lib/plugin_env/plugin_ident";
import { KernelEnvironment } from "../kernel_env";

export function register_get_plugin_command(KEV: typeof KernelEnvironment) {
    KEV.add_plugin_command({
        command: "get_plugin",
        on_command: Effect.fn("get_plugin")(
            function* (communicator: KernelEnvironment, handler: EnvironmentCommunicationHandler, data: Json) {
                const plugin_ident = yield* Schema.decodeUnknown(pluginIdentSchema)(data).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Failed to decode plugin ident",
                        error: e
                    }))
                );
                const res = communicator.get_plugin(plugin_ident);
                const plugin = yield* ResultToEffect(res).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Callback error creating plugin",
                        error: e
                    }))
                );

                yield* handler.close({
                    address: plugin.address.serialize(),
                    plugin_ident: plugin.plugin_ident
                }, true).pipe(Effect.ignore);
            })
    })
}