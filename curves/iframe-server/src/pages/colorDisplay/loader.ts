import { BrowserPlatform } from "pc-messaging-kernel/platform";
import { plugin } from "./plugin";

let pluginStarted = false;

export function initColorDisplayPlugin() {
    if (pluginStarted) return;
    pluginStarted = true;

    BrowserPlatform.start_iframe_plugin(plugin);
}
