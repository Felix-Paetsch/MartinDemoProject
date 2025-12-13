import { BrowserPlatform } from "pc-messaging-kernel/platform";
import { plugin } from "./plugin";

let pluginStarted = false;

export function initColorPickerPlugin() {
    if (pluginStarted) return;
    pluginStarted = true;

    BrowserPlatform.start_iframe_plugin(plugin);
}
