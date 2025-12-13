import {
    get_environment,
    assert
} from "pc-messaging-kernel/utils"
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";
import { Canvas } from "./ui";
import { BrowserPlatform } from "pc-messaging-kernel/platform";

export default async (env: PluginEnvironment) => {
    assert(get_environment() === "browser")
    const mp = await env.get_plugin({
        name: "color_display"
    });

    if (mp instanceof Error) {
        throw mp;
    }
}

BrowserPlatform.on_canvas_request(
    () => new Canvas()
)
