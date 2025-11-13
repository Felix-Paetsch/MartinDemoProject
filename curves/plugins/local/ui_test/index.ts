import { BranchedMessagePartner, PluginEnvironment, PluginMessagePartner, PsLogging } from "pc-messaging-kernel/plugin";
import { UILibrary } from "../../../lib/ui/exports";

export default async (env: PluginEnvironment) => {
    const UI_element = await UILibrary.create_window(env);
    console.log("CREATED", UI_element);

    console.log("<< STARTING SIDE PLUGIN >>");
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
