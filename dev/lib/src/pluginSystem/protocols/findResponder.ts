import { PluginIdentWithInstanceId } from "pc-messaging-kernel/_pluginSystem/plugin_lib/exports";
import { KernelEnvironment } from "../kernel_lib/kernel_env";
import { PluginEnvironment } from "../plugin_lib/plugin_environment";
import { Json } from "pc-messaging-kernel/utils/json";
import { Schema } from "effect";
import { pluginIdentWithInstanceIdSchema } from "../plugin_lib/plugin_ident";

export function findKernel(): KernelEnvironment | null {
    return KernelEnvironment.singleton;
}

export function findPlugin(plugin_ident: string | PluginIdentWithInstanceId | Json): PluginEnvironment | null {
    let insatance_id: string;
    if (typeof plugin_ident === "string") {
        insatance_id = plugin_ident;
    } else {
        try {
            insatance_id = Schema.decodeUnknownSync(pluginIdentWithInstanceIdSchema)(plugin_ident).instance_id;
        } catch (error) {
            return null;
        }
    }
    return PluginEnvironment.plugins.find(plugin => plugin.plugin_ident.instance_id === insatance_id) || null;
}
