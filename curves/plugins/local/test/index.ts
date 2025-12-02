import { BranchedMessagePartner, PluginEnvironment, PluginMessagePartner, PsLogging } from "pc-messaging-kernel/plugin";
import * as Assets from "../../../lib/assets/exports";

export default async (env: PluginEnvironment) => {
    console.log("<< STARTING SIDE PLUGIN >>");
    Assets.create(env);
    env.on_plugin_request((mp: PluginMessagePartner) => {
        mp.on_branch((b: BranchedMessagePartner) => {
            b.on_message((data) => {
                console.log(data + ", and I must scream");
            });
            b.on_message_listener_registered(async (b) => {
                await b.send_message("I am here");

                env.on_remove(() => {
                    console.log("Removing self");
                });
                setTimeout(() => env.remove_self(), 5000);
                // env.remove_self();
            });
        });

        env.log("Hello from side plugin", PsLogging.Severity.INFO);
    });
}
