import { Effect } from "effect";
import { Synchronizer } from "./synchronizer";
import { Address, Connection, Json, Port } from "../../../messaging/exports";
import { PluginIdentWithInstanceId } from "../../plugin_lib/plugin_env/plugin_ident";
import { PrimitiveMessageChannel } from "./synchronizer";

export async function initializeExternalPlugin_PluginSide(
    channel: PrimitiveMessageChannel,
    run_plugin: (port: Port) => void | Promise<void>,
) {
    return Effect.gen(function* () {
        const synchronizer = new Synchronizer(channel);

        synchronizer.add_command(
            "run_plugin",
            async (data) => {
                const _data = data as {
                    pluginIdent: PluginIdentWithInstanceId;
                    target_process_id: string;
                    own_process_id: string;
                };

                const connection = Connection.create(
                    Address.generic(_data.own_process_id),
                    (msg) => synchronizer.call_command("send_message", msg)
                ).open();

                synchronizer.add_command("send_message", (data: Json) => {
                    return connection.recieve(data as any);
                });

                Address.set_process_id(_data.target_process_id);
                const port = new Port(_data.pluginIdent.instance_id).open();
                await run_plugin(port);
                synchronizer.call_command("on_plugin_executed");
            }
        );

        yield* Effect.promise(() => synchronizer.sync());
    }).pipe(Effect.runPromise)
}