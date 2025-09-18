import { Deferred, Effect } from "effect";
import { TimeoutException } from "effect/Cause";
import { PluginEnvironment, Plugin } from "../../../../lib/src/pluginSystem/plugin_lib/plugin_environment";
import { EffectToResult, Json, UnblockFiber } from "../../../../lib/src/utils/exports";
import { initializeExternalPlugin_PluginSide } from "../../../../lib/src/pluginSystem/common_lib/initialization/pluginSide";
import { PrimitiveMessageChannel } from "../../../../lib/src/pluginSystem/common_lib/initialization/synchronizer";
import { Port } from "../../../../lib/src/messaging/exports";

export async function execute_plugin(plugin: Plugin) {
    const channel: PrimitiveMessageChannel = await registerChannelPlugin();

    await initializeExternalPlugin_PluginSide(
        channel,
        plugin
    )
}

function registerChannelPlugin() {
    return Effect.async<{
        send: (data: Json) => void,
        receive: (cb: (data: Json) => void) => void
    }, TimeoutException>((resume) => {
        let pluginPort: MessagePort | null = null;

        const send = (data: Json) => {
            pluginPort!.postMessage(data);
        }

        const receive = (cb: (data: Json) => void | Promise<void>) => {
            pluginPort!.onmessage = (event) => {
                // console.log(event);
                cb(event.data || {})
            };
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
                    receive
                }));
            }
        };

        window.addEventListener('message', initListener);
        window.addEventListener('message', portListener);

        window.parent.postMessage({
            type: 'ck-initialization-port-request'
        }, '*');
    }).pipe(
        Effect.timeout(10000),
        Effect.runPromise
    );
}
