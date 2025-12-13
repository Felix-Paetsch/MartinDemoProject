import {
    get_environment
} from "pc-messaging-kernel/utils"
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";

import NodeRootPlugin from "./node/index";
import BrowserRootPlugin from "./browser/index";

export default async (env: PluginEnvironment) => {
    if (get_environment() === "node") {
        return NodeRootPlugin(env);
    } else {
        return BrowserRootPlugin(env);
    }
}

