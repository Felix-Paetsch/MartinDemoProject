import { cacheFun, mapSuccessAsync } from "../../../utils/exports";
import { get_api_data } from "../enpoints/index";
import { ExecutablePlugin } from "../../types";
import { PluginsApiData } from "../../server/api";
import { request_canvas } from "../canvas";

export type BackendIframePluginData = PluginsApiData[number] & {
    type: "iframe"
}

async function _getAPIPlugins(): Promise<
    Error | Record<string, ExecutablePlugin>
> {
    return await mapSuccessAsync(
        get_api_data("get_api_plugins"),
        (plugins) => {
            const ret: Record<string, ExecutablePlugin> = {};
            for (const p of plugins) {
                ret[p.name] = {
                    plugin_descr: p,
                    execute: async (k, ident) => {
                        const canvas = request_canvas();
                        if (canvas) {
                            return await canvas.load_iframe_plugin(ident);
                        }

                        // execute_iframe_plugin(p, ident, k)
                        return new Error("Cant aquire a canvas for iframe");
                    }
                }
            }

            return ret;
        }
    )
}

export const getAPIPlugins = cacheFun(_getAPIPlugins);
