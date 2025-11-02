import { BranchedMessagePartner, PluginEnvironment, PluginMessagePartner, PsLogging } from "pc-messaging-kernel/plugin";

export default async (env: PluginEnvironment) => {
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
                env.remove_self();
            });
        });

        env.log("Hello from side plugin", PsLogging.Severity.INFO);
    });

// const lib = await env.get_library({
//     name: "test",
//     version: "1.0.0"
// });
// if (lib instanceof Error) {
//     console.log("This is an error");
//     throw lib;
// }
// const res = await lib.call("hi", ["Martin"]);
// console.log(res);
}
