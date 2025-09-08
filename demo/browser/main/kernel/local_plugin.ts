import { Effect } from "effect";
import { Address } from "pc-messaging-kernel/messaging";
import { KernelEnvironment } from "pc-messaging-kernel/pluginSystem/kernel";
import { PluginEnvironment, PluginIdent, PluginIdentWithInstanceId } from "pc-messaging-kernel/pluginSystem/plugin";
import { asyncCallbackToEffect, callbackToEffect, ResultToEffect } from "pc-messaging-kernel/utils";

export const createLocalPlugin = Effect.fn("createLocalPlugin")(
    function* (k: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId, pluginAddress: Address) {
        const name = plugin_ident.name.toLowerCase();

        const imported = yield* asyncCallbackToEffect(() => import(`../../local_plugins/${name}/index.ts`))
        const plugin: (env: PluginEnvironment) => Promise<void> = imported.default;

        const { env, ref } = yield* ResultToEffect(
            k.create_local_plugin_environment(plugin_ident, pluginAddress)
        );

        k.register_plugin_middleware(ref);
        k.register_local_plugin_middleware(env);

        yield* callbackToEffect(plugin, env);
        return ref;
    })

export const isLocalPlugin = (plugin_ident: PluginIdent) => Effect.async<boolean>((resume) => {
    const name = plugin_ident.name.toLowerCase();
    // /src/demos/website/core/..
    const potential_path = `/demo/browser/local_plugins/${name}/index.ts`;

    fetch(potential_path).then(
        r => {
            const content_type = r.headers.get("content-type") || "error";
            resume(Effect.succeed(r.ok && (
                content_type == "text/js"
                || content_type == "text/javascript"
            )));
        }
    ).catch(e => resume(Effect.succeed(false)));
}).pipe(Effect.withSpan("testIsLocalPlugin"))