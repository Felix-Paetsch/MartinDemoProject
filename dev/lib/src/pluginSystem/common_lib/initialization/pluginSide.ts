import { Effect } from "effect";
import { Synchronizer } from "./synchronizer";
import { Failure, Address, Connection, Json, Logging, Port } from "../../../messaging/exports";
import { PrimitiveMessageChannel } from "./synchronizer";
import { PluginIdentWithInstanceId } from "../../plugin_lib/plugin_ident";
import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { AddressAlreadyInUseError } from "../../../messaging/core/errors/errors";

Failure.setAnomalyHandler((e) => {
    console.log(e);
    throw e;
});

Failure.setErrorHandler((e) => {
    console.log(e);
    throw e;
});

export async function initializeExternalPlugin_PluginSide(
    channel: PrimitiveMessageChannel,
    plugin: (env: PluginEnvironment) => void | Promise<void>,
) {
    return Effect.gen(function* () {
        const synchronizer = new Synchronizer(channel);

        synchronizer.add_command(
            "run_plugin",
            async (data) => {
                const _data = data as {
                    pluginIdent: PluginIdentWithInstanceId;
                    plugin_process_id: string;
                    kernel_process_id: string;
                };

                const connection = Connection.create(
                    Address.generic(_data.kernel_process_id),
                    (msg) => synchronizer.call_command("send_message", msg)
                ).open();

                if (connection instanceof AddressAlreadyInUseError) {
                    throw connection;
                }

                synchronizer.add_command("send_message", (data: Json) => {
                    return connection.receive(data as any);
                });

                Address.set_process_id(_data.plugin_process_id);
                Logging.set_logging_target(connection.address);
                const env = new PluginEnvironment(
                    _data.kernel_process_id,
                    _data.pluginIdent
                );
                env.use_middleware(Logging.log_middleware(), "monitoring");
                await plugin(env);
                synchronizer.call_command("on_plugin_executed");
            }
        );

        yield* Effect.promise(() => synchronizer.sync());
    }).pipe(Effect.runPromise)
}
