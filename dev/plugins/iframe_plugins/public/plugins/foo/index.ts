import { execute_plugin } from "../../lib/connect";
import { PluginEnvironment } from "../../../../../lib/src/pluginSystem/plugin_lib/plugin_environment";
import Bridge from "../../../../../lib/src/pluginSystem/plugin_lib/message_partner/bridge";

const closeButton = document.getElementById("close")!;
const closeRightButton = document.getElementById("close-right")!;

execute_plugin(async (env: PluginEnvironment) => {
    console.log("<< STARTING FOO PLUGIN >>");

    let main_plugin_bridge: Bridge | null = null;
    env.on_plugin_request(async (mp) => {
        /* Todo: With callbacks like these
            you should decide if the callback runs before or after
            the complete initialization.
            I.e. currently if you request a bridge,
            the message partner can't have set up a listener
            Alternative: Provide a listener on setUp of the mp.
        */
        mp.on_bridge((bridge) => {
            main_plugin_bridge = bridge;
        });
    });

    env.on_remove(async () => {
        console.log("Plugin::on remove");
        if (main_plugin_bridge) {
            await main_plugin_bridge.send("close");
        }
    })

    closeButton.addEventListener("click", () => {
        env.remove_self();
    });

    closeRightButton.addEventListener("click", async () => {
        if (main_plugin_bridge) {
            await main_plugin_bridge.send("close right");
        }
    });
});
