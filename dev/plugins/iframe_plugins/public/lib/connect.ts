import { Deferred, Effect } from "effect";
import { TimeoutException } from "effect/Cause";
import { Middleware as DebugMiddleware } from "../../../../lib/src/debug/exports";
import { Middleware as CommonMiddleware, Initialization } from "../../../../lib/src/pluginSystem/common_lib/exports";
import { Plugin, PluginEnvironment } from "../../../../lib/src/pluginSystem/plugin_lib/exports";
import { EffectToResult, Json, UnblockFiber } from "../../../../lib/src/utils/exports";

export default function execute_plugin(
    plugin: Plugin
) {
    return Effect.gen(function* () {
        const channel = yield* registerChannelPlugin();
        const awaitPluginInitialized = yield* Deferred.make<0>();

        Initialization.plugin(
            channel,
            (plugin_env: PluginEnvironment) => {
                return Effect.gen(function* () {
                    plugin_env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
                    plugin_env.useMiddleware(DebugMiddleware.plugin(plugin_env.kernel_address), "monitoring");

                    yield* Deferred.succeed(awaitPluginInitialized, 0);
                })
            },
            plugin
        );

        return yield* Deferred.await(awaitPluginInitialized).pipe(UnblockFiber);
    }).pipe(
        Effect.withSpan("PluginEvaluation"),
        EffectToResult
    )
}

function registerChannelPlugin() {
    return Effect.async<{
        send: (data: Json) => void,
        recieve: (cb: (data: Json) => void) => void
    }, TimeoutException>((resume) => {
        let pluginPort: MessagePort | null = null;

        const send = (data: Json) => {
            pluginPort!.postMessage(data);
        }

        const recieve = (cb: (data: Json) => void) => {
            pluginPort!.onmessage = (event) => cb(event.data || {});
        }

        const initListener = (event: MessageEvent) => {
            if (
                event.source === window.parent &&
                event.data === 'ck-intinialization-callbacks-registered'
            ) {
                window.parent.postMessage({
                    type: 'ck-initialization-port-request'
                }, '*');
                window.removeEventListener('message', initListener);
            }
        };

        const portListener = (event: MessageEvent) => {
            if (
                event.source === window.parent &&
                event.data === 'ck-initialization-port-response' &&
                event.ports && event.ports.length > 0
            ) {
                pluginPort = event.ports[0]!;
                pluginPort.start();

                window.removeEventListener('message', portListener);
                resume(Effect.succeed({
                    send,
                    recieve
                }));
            }
        };

        window.addEventListener('message', initListener);
        window.addEventListener('message', portListener);

        window.parent.postMessage({
            type: 'ck-initialization-port-request'
        }, '*');
    }).pipe(
        Effect.timeout(10000)
    );
}