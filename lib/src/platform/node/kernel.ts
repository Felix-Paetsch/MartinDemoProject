import { GetPluginError, KernelEnvironment, PluginIdent, PluginReference } from "../../pluginSystem/exports";
import { uuidv4, mapBothAsync } from "../../utils/exports";
import { getLocalPlugins } from "./get_plugins/local";
import { Failure } from "../../messaging/exports";

const localPlugins = getLocalPlugins().catch(r => r as Error);

export class NodeKernelEnvironment extends KernelEnvironment {
    async create_plugin(plugin_ident: PluginIdent): Promise<PluginReference | GetPluginError> {
        const ident_with_id = {
            instance_id: plugin_ident.name + "_" + uuidv4(),
            ...plugin_ident
        }

        let plugin = await mapBothAsync(localPlugins, (plugins) => {
            const p = plugins[ident_with_id.name]
            if (!p) {
                return false as const;
            }

            return p.execute(this, ident_with_id)
        }, () => false as const);

        if (plugin instanceof Error) {
            Failure.reportAnomaly(plugin);
            plugin = false;
        }

        if (plugin === false) {
            return new Error("[No local plugin] Unimplemeted: Get Plugin.. " + ident_with_id.name);
        }

        return plugin;
    }
}
