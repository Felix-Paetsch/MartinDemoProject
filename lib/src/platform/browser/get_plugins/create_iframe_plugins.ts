import { Effect } from "effect";
import { TimeoutException } from "effect/Cause";
import { BackendIframePluginData } from "./api";
import { Initialization, KernelEnvironment, PluginIdentWithInstanceId, PluginReference } from "../../../pluginSystem/exports";
import { Address, Json } from "../../../messaging/exports";
import { cacheFun } from "../../../utils/exports";

const appContainer = cacheFun(() => {
    return document.getElementById("app")!;
})

function createIframe(id: string, src: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;

    return iframe;
}

export async function execute_iframe_plugin(
    ifd: BackendIframePluginData,
    plugin_ident: PluginIdentWithInstanceId,
    kernel: KernelEnvironment
): Promise<Error | PluginReference> {
    const iframe = createIframe(
        "plugin_" + plugin_ident.instance_id,
        ifd.root_url
    );
    appContainer().appendChild(iframe);

    const c: Initialization.MessageChannel | Error = await registerChannelKernel(iframe);
    if (c instanceof Error) {
        return c;
    }

    const res = await Initialization.kernelSide(
        c,
        plugin_ident
    )

    if (res instanceof Error) return res;

    const plugin_reference = new PluginReference(
        new Address(plugin_ident.instance_id, plugin_ident.instance_id),
        plugin_ident,
        kernel,
        () => {
            res.connection.close();
            appContainer().removeChild(iframe);
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
