import { Effect } from "effect";
import { TimeoutException } from "effect/Cause";
import { Address, Connection } from "../../../../lib/src/messaging/exports";
import { initializeExternalPlugin_KernelSide } from "../../../../lib/src/pluginSystem/common_lib/initialization/kernelSide";
import { callbackToEffect, Json } from "../../../../lib/src/utils/exports";
import { KernelEnvironment } from "../../../../lib/src/pluginSystem/kernel_lib/kernel_env";
import { PluginIdentWithInstanceId } from "../../../../lib/src/pluginSystem/plugin_lib/plugin_ident";
import { PrimitiveMessageChannel } from "../../../../lib/src/pluginSystem/common_lib/initialization/synchronizer";
import { PluginReference } from "../../../../lib/src/pluginSystem/kernel_lib/external_references/plugin_reference";

const appContainer = document.getElementById("app")!;
function createIframe(id: string, src: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;

    return iframe;
}

export async function createIframePlugin(k: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId, processId: string) {
    const iframe = createIframe(
        "plugin_" + plugin_ident.instance_id,
        `http://localhost:3001/plugins/${plugin_ident.name}/index.html`
    );
    appContainer.appendChild(iframe);

    const c: PrimitiveMessageChannel | Error = await registerChannelKernel(iframe);
    if (c instanceof Error) {
        return c;
    }

    const res = await initializeExternalPlugin_KernelSide(
        c,
        processId,
        plugin_ident
    )

    if (res instanceof Error) return res;

    const plugin_reference = new PluginReference(
        new Address(processId, plugin_ident.instance_id),
        plugin_ident,
        k,
        () => {
            res.connection.close();
            appContainer.removeChild(iframe);
        }
    );
    await res.run_plugin();
    return plugin_reference;
}

export function registerChannelKernel(iframe: HTMLIFrameElement) {
    return Effect.async<{
        send: (data: Json) => void,
        receive: (cb: (data: Json) => void) => void
    }, TimeoutException>((resume) => {
        const { port1: mainPort, port2: iframePort } = new MessageChannel();
        mainPort.start();

        const send = (data: Json) => { mainPort.postMessage(data); }
        const receive = (cb: (data: Json) => void | Promise<void>) => {
            mainPort.onmessage = (event) => {
                cb(event.data || {});
            }
        }
        add_port_init_event_listener(iframe, iframePort, () => resume(Effect.succeed({
            send,
            receive
        })));
    }).pipe(
        Effect.timeout(10000),
        Effect.catchAll(() => Effect.succeed(new Error("Timeout when registering channel"))),
        Effect.runPromise
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
