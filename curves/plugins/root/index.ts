import {
    PluginEnvironment
} from "pc-messaging-kernel/kernel"
import {
    get_environment
} from "pc-messaging-kernel/utils"
import "./ui"

export default async (env: PluginEnvironment) => {
    let plugin_name = "main_react";

    if (get_environment() == "node") {
        plugin_name = "test";
    }

    const mp = await env.get_plugin({
        name: plugin_name,
        version: "1.0.0"
    });
    if (mp instanceof Error) {
        throw mp;
    }

    const br = await mp.branch();
    if (br instanceof Error) {
        throw br;
    }

    await br.send_message("I have no mouth");
    br.on_message((data) => {
        console.log(data + ", and I must still scream");
    });
}
