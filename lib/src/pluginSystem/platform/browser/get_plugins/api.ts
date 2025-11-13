import { mapSuccessAsync } from "../../../../utils/error_handling";
import { get_api_data } from "../api_endpoints";
import { ExecutablePlugin } from "../../types";
import { PluginsApiData } from "../../server/api";
import { execute_iframe_plugin } from "./create_iframe_plugins";

export type BackendIframePluginData = PluginsApiData[number] & {
    type: "iframe"
}

export async function getAPIPlugins(): Promise<
    Error | Record<string, ExecutablePlugin>
> {
    return await mapSuccessAsync(
        get_api_data("get_api_plugins"),
        (plugins) => {
            const ret: Record<string, ExecutablePlugin> = {};
            for (const p of plugins) {
                ret[p.name] = {
                    name: p.name,
                    execute: (k, ident) => execute_iframe_plugin(p, ident, k)
                }
            }

            return ret;
        }
    )
}
