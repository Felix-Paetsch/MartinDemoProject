import {
    PluginEnvironment,
    Plugin
} from "../../../pluginSystem/exports";
import { mapSuccessAsync } from "../../../utils/exports";
import { get_api_data } from "../enpoints/index";
import { ExecutablePlugin } from "../../types";
import { BackendLocalPluginData } from "../enpoints/get_local_plugins";

async function load_api_plugin(val: BackendLocalPluginData): Promise<Error | Plugin> {
    return import(window.location.pathname + val.path).then(
        (importet) => importet.default as (env: PluginEnvironment) => Promise<void>
    ).then(
        async (plugin) => plugin as Plugin
    ).catch(e => e as Error);
}

export async function getLocalPlugins(): Promise<
    Error | Record<string, ExecutablePlugin>
> {
    return await mapSuccessAsync(
        get_api_data("local_plugins"),
        (r) => {
            const ret: Record<string, ExecutablePlugin> = Object.fromEntries(
                Object.entries(r).map(([key, value]) => [key, {
                    plugin_descr: {
                        type: "local",
                        name: value.name
                    },
                    execute: (kernel, ident_with_id) => {
                        return mapSuccessAsync(
                            load_api_plugin(value),
                            async (plugin) => {
                                const { env, ref } = kernel.create_local_plugin_environment(ident_with_id);
                                await plugin(env);
                                return ref;
                            }
                        )
                    }
                }])
            );

            return ret;
        }
    )
}
