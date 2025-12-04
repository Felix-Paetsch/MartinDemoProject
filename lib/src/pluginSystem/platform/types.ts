import { KernelEnvironment, PluginIdent, PluginReference } from "../../pluginSystem/kernel_exports";
import { PluginIdentWithInstanceId } from "../plugin_lib/plugin_ident";
import { PluginsApiData } from "./server/api";


export function is_iframe_plugin(p: PluginDescr): p is PluginDescr & { type: "iframe" } {
    return p.type === "iframe";
}

export type PluginDescr = PluginsApiData[number] | {
    type: "local",
    name: string
}

export type ExecutablePlugin = {
    plugin_descr: PluginDescr,
    execute: (kernel: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId) => Promise<Error | PluginReference>;
}
