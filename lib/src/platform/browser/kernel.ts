import {
    KernelEnvironment,
    PluginIdent,
} from "../../pluginSystem/exports";
import { mapBothAsync } from "../../utils/error_handling";
import { reportAnomaly } from "../../messaging/core/errors/anomalies";
import { getLocalPlugins } from "./get_plugins/local";
import { getAPIPlugins } from "./get_plugins/api";
import { ExecutablePlugin } from "../types";
import { cacheFun, uuidv4 } from "../../utils/exports";

const localPlugins = cacheFun(() => getLocalPlugins().catch(r => r as Error));
const apiPlugins = cacheFun(() => getAPIPlugins().catch(r => r as Error));

async function available_plugins() {
    const [r1, r2] = await Promise.all([apiPlugins(), localPlugins()]);
    const res: Record<string, ExecutablePlugin> = {};
    if (!(r1 instanceof Error)) {
        Object.assign(res, r1);
    }
    if (!(r2 instanceof Error)) {
        Object.assign(res, r2);
    }
    return res;
}

export class BrowserKernelEnvironment extends KernelEnvironment {
    async create_plugin(plugin_ident: PluginIdent) {
        const ident_with_id = {
            instance_id: uuidv4(),
            ...plugin_ident
        }

        let plugin = await mapBothAsync(available_plugins(), (plugins) => {
            const p = plugins[ident_with_id.name];
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
}
