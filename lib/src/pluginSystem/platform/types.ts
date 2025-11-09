import { KernelEnvironment, PluginReference } from "../../pluginSystem/kernel_exports";
import { PluginIdent, PluginIdentWithInstanceId } from "../plugin_lib/plugin_ident";

export type ExecutablePlugin = {
    name: string;
    execute: (kernel: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId) => Promise<Error | PluginReference>;
}
