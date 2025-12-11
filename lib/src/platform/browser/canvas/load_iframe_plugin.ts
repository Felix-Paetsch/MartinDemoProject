import { Effect } from "effect";
import { TimeoutException } from "effect/Cause";
import { BackendIframePluginData } from "../get_plugins/api";
import { Initialization, KernelEnvironment, PluginIdentWithInstanceId, PluginReference } from "../../../pluginSystem/exports";
import { Address, Json } from "../../../messaging/exports";
import { init_iframe_sync, sync_iframe_position } from "./sync_iframe_position";

function createIframe(id: string, src: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;
    document.body.appendChild(iframe);
    return iframe;
}

export async function load_iframe_plugin(
    ifd: BackendIframePluginData,
    plugin_ident: PluginIdentWithInstanceId,
    kernel: KernelEnvironment,
    el: HTMLDivElement
): Promise<Error | {
    ref: PluginReference,
    iframe: HTMLIFrameElement
}> {
    const iframe = createIframe(
        "plugin_" + plugin_ident.instance_id,
        ifd.root_url
    );
    const iframe_div = document.createElement("div");
    iframe_div.style.height = "100%";
    iframe_div.style.width = "100%";
    iframe_div.style.overflow = "hidden";
    iframe_div.classList.add("iframeDiv");
    el.appendChild(iframe_div);
    init_iframe_sync(iframe, iframe_div);

    const c: Initialization.MessageChannel | Error = await registerChannelKernel(iframe);
    if (c instanceof Error) {
        return c;
    }

    const res = await Initialization.kernelSide(
        c,
        plugin_ident
    );

    if (res instanceof Error) return res;

    const plugin_reference = new PluginReference(
        new Address(plugin_ident.instance_id, plugin_ident.instance_id),
        plugin_ident,
        kernel,
        () => {
            // res.connection.close();
            // iframe.remove();
        }
    );

    await res.run_plugin();
    return {
        ref: plugin_reference,
        iframe
    }
}

export function registerChannelKernel(iframe: HTMLIFrameElement) {
    return Effect.async<{
        send: (data: Json) => void,
        receive: (cb: (data: Json) => void) => void
    }, TimeoutException>((resume) => {
        const { port1: mainPort, port2: iframePort } = new MessageChannel();
        mainPort.start();

        const send = (data: Json) => {
            mainPort.postMessage(data);
        }
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

export function registerPortChannelKernel(iframe: HTMLIFrameElement) {
    return Effect.async<{
        send: (data: Json) => void,
        receive: (cb: (data: Json) => void) => void
    }, TimeoutException>((resume) => {
        const { port1: mainPort, port2: iframePort } = new MessageChannel();
        mainPort.start();

        const send = (data: Json) => {
            mainPort.postMessage(data);
        }
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
