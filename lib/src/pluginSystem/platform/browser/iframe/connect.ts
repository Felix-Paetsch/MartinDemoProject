import { Effect } from "effect";
import { TimeoutException } from "effect/Cause";
import {
    Initialization,
    Plugin,
    Json
} from "../../../plugin_exports";

export async function execute_plugin(plugin: Plugin) {
    const channel: Initialization.MessageChannel = await registerChannelPlugin();
    await Initialization.pluginSide(
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
