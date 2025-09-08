import { Effect } from "effect";
import { TimeoutException } from "effect/Cause";
import { Address } from "../../../../lib/src/messaging/exports";
import { Initialization, type MessageChannel } from "../../../../lib/src/pluginSystem/common_lib/exports";
import { KernelEnvironment, PluginReference } from "../../../../lib/src/pluginSystem/kernel_lib/exports";
import { PluginIdentWithInstanceId } from "../../../../lib/src/pluginSystem/plugin_lib/exports";
import { callbackToEffect, Json } from "../../../../lib/src/utils/exports";
const appContainer = document.getElementById("app")!;
function createIframe(id: string, src: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;

    return iframe;
}

export const createIframePlugin = Effect.fn("createIframePlugin")(
    function* (k: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId, pluginAddress: Address) {
        const iframe = createIframe(
            pluginAddress.serialize().replace(/\s|:/g, "_"),
            `http://localhost:3001/plugins/${plugin_ident.name}/index.html`
        );
        appContainer.appendChild(iframe);
        const c: MessageChannel = yield* registerChannelKernel(iframe);
        const {
            execute,
            remove
        } = yield* Initialization.kernel(c, k.address, pluginAddress, plugin_ident);

        const plugin_reference = new PluginReference(
            pluginAddress,
            plugin_ident,
            k,
            async () => {
                await remove();
                appContainer.removeChild(iframe);
            }
        );
        k.register_plugin_middleware(plugin_reference);

        yield* callbackToEffect(execute);
        return plugin_reference;
    }
)

export function registerChannelKernel(iframe: HTMLIFrameElement) {
    return Effect.async<{
        send: (data: Json) => void,
        recieve: (cb: (data: Json) => void) => void
    }, TimeoutException>((resume) => {
        const { port1: mainPort, port2: iframePort } = new MessageChannel();
        mainPort.start();

        const send = (data: Json) => { mainPort.postMessage(data); }
        const recieve = (cb: (data: Json) => void) => {
            mainPort.onmessage = (event) => cb(event.data || {});
        }
        add_port_init_event_listener(iframe, iframePort, () => resume(Effect.succeed({
            send,
            recieve
        })));

        return Effect.never;
    }).pipe(
        Effect.timeout(10000)
    );
}

function add_port_init_event_listener(iframe: HTMLIFrameElement, iframePort: MessagePort, resume: () => void) {
    const listener = (event: MessageEvent) => {
        if (
            event.source === iframe.contentWindow &&
            event.data.type === 'ck-initialization-port-request'
        ) {
            iframe.contentWindow?.postMessage('ck-initialization-port-response', '*', [iframePort]);
            window.removeEventListener('message', listener);
            resume();
        }
    }
    window.addEventListener('message', listener);
    iframe.addEventListener('load', () => {
        iframe.contentWindow?.postMessage('ck-intinialization-callbacks-registered', '*');
    });
}