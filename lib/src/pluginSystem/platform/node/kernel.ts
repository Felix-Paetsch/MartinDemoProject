import { reportAnomaly } from "../../../messaging/core/errors/anomalies";
import { LibraryReference } from "../../../pluginSystem/kernel_lib/external_references/library_reference";
import { PluginReference } from "../../../pluginSystem/kernel_lib/external_references/plugin_reference";
import { GetPluginError, KernelEnvironment } from "../../../pluginSystem/kernel_lib/kernel_env";
import { LibraryIdent, uuidv4 } from "../../../pluginSystem/plugin_exports";
import { PluginIdent } from "../../../pluginSystem/plugin_lib/plugin_ident";
import { GetLibraryError } from "../../../pluginSystem/protocols/plugin_kernel/get_library";
import { mapBothAsync } from "../../../utils/error_handling";
import { getLocalPlugins } from "./get_plugins/local";

const localPlugins = getLocalPlugins().catch(r => r as Error);

export class NodeKernelEnvironment extends KernelEnvironment {
    async create_plugin(plugin_ident: PluginIdent): Promise<PluginReference | GetPluginError> {
        const ident_with_id = {
            instance_id: uuidv4(),
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
            reportAnomaly(plugin);
            plugin = false;
        }

        if (plugin === false) {
            return new Error("[No local plugin] Unimplemeted: Get Plugin.. " + ident_with_id.name);
        }

        return plugin;
    }

    create_library(library_ident: LibraryIdent): Promise<LibraryReference | GetLibraryError> {
        throw new Error("Unimplemented")
    }
}
