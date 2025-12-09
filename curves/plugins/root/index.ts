import {
    get_environment
} from "pc-messaging-kernel/utils"
import { Canvas } from "./ui";
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";
import { BrowserPlatform } from "pc-messaging-kernel/platform";

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

    // const canvas = BrowserPlatform.request_canvas();
    // if (canvas) {
    //     const el = canvas.element();
    //     el.innerHTML = "Helllllo"
    //     el.style.backgroundColor = "red";
    // }

    // const br = await mp.branch();
    // if (br instanceof Error) {
    //     throw br;
    // }
    //
    // await br.send_message("I have no mouth");
    // br.on_message((data) => {
    //     console.log(data + ", and I must still scream");
    // });
}

BrowserPlatform.on_canvas_request(
    () => new Canvas()
)
