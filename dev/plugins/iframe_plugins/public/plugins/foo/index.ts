import { execute_plugin } from "../../lib/connect";
import { PluginEnvironment, PluginMessagePartner } from "../../../../../lib/src/pluginSystem/plugin_exports";

const closeButton = document.getElementById("close")!;
const closeRightButton = document.getElementById("close-right")!;

execute_plugin(async (env: PluginEnvironment) => {
    console.log("<< STARTING FOO PLUGIN >>");

    let main_plugin: PluginMessagePartner | null = null;
    env.on_plugin_request(async (mp) => {
        /* Todo: With callbacks like these
            you should decide if the callback runs before or after
            the complete initialization.
            I.e. currently if you request a bridge,
            the message partner can't have set up a listener
            Alternative: Provide a listener on setUp of the mp.
        */
        main_plugin = mp;
    });

    env.on_remove(async () => {
        console.log("Plugin::on remove");
        if (main_plugin) {
            await main_plugin.send_message("close");
        }
    })

    closeButton.addEventListener("click", () => {
        env.remove_self();
    });

    closeRightButton.addEventListener("click", async () => {
        if (main_plugin) {
            await main_plugin.send_message("close right");
        }
    });
});
