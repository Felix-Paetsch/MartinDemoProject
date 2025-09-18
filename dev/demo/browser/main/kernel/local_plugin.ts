import { Effect } from "effect";
import { Address } from "../../../../lib/src/messaging/exports";
import { asyncCallbackToEffect, callbackToEffect, ResultToEffect } from "../../../../lib/src/utils/exports";
import { KernelEnvironment } from "../../../../lib/src/pluginSystem/kernel_lib/kernel_env";
import { PluginIdentWithInstanceId, PluginIdent } from "../../../../lib/src/pluginSystem/plugin_lib/plugin_ident";
import { PluginEnvironment } from "../../../../lib/src/pluginSystem/plugin_lib/plugin_environment";

export function createLocalPlugin(k: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId, path: string) {
    return import(path).catch(e => {
        throw new Error("Failed to find plugin");
    }).then(
        (importet) => importet.default as (env: PluginEnvironment) => Promise<void>
    ).then(
        async (plugin) => {
            const { env, ref } = k.create_local_plugin_environment(plugin_ident)
            await plugin(env).catch(e => {
                throw new Error("Error executing plugin")
            });
            return ref;
        }
    )
}

export const isLocalPlugin = (plugin_ident: PluginIdent): Promise<boolean> => {
    const name = plugin_ident.name.toLowerCase();
    // /src/demos/website/core/..
    const potential_path = `/demo/browser/local_plugins/${name}/index.ts`;
    return fetch(potential_path).then(
        r => {
            const content_type = r.headers.get("content-type") || "error";
            return r.ok && (
                content_type == "text/js"
                || content_type == "text/javascript"
            );
        }
    ).catch(() => false);
}
