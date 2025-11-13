import { Plugin } from "pc-messaging-kernel/plugin";
import { BranchedMessagePartner, BrowserPlatform, PluginMessagePartner } from "pc-messaging-kernel/kernel";

export default function About() {
    const plugin: Plugin = (env) => {
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
                    // setTimeout(() => env.remove_self(), 5000);
                });
            });
        });
    }

    console.log(BrowserPlatform);
    BrowserPlatform.start_iframe_plugin(plugin);

    return (
        <div>
            <h1>About</h1>
            <p>This page is part of a React + Vite demo project!</p>
        </div>
    );
}
