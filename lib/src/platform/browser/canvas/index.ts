import { KernelEnvironment, PluginIdent, PluginIdentWithInstanceId, PluginReference } from "../../../pluginSystem/exports";
import { is_iframe_plugin } from "../../types";
import { getAPIPlugins } from "../get_plugins/api";
import { load_iframe_plugin } from "./load_iframe_plugin";
import { terminate_plugin } from "./remove_iframe_plugin_cb";
import { sync_iframe_position } from "./sync_iframe_position";

export type CanvasDescr = {
    type: "iframe",
    iframe: HTMLIFrameElement,
    ref: PluginReference
} | {
    type: "local"
} | {
    type: "error"
};

export abstract class Canvas {
    abstract element(): HTMLDivElement;

    private _descr: CanvasDescr = {
        type: "local"
    };
    get descr(): CanvasDescr {
        return this._descr;
    }

    async load_iframe_plugin(ident: PluginIdentWithInstanceId): Promise<Error | PluginReference> {
        this.clear();
        this._descr = {
            type: "error"
        };

        const plugins = await getAPIPlugins();
        if (plugins instanceof Error) return plugins;
        const plugin = plugins[ident.name];
        if (!plugin) return new Error(`Plugin ${ident.name} not found`);
        if (!is_iframe_plugin(plugin.plugin_descr)) {
            return new Error(`Plugin ${ident.name} is not an iframe plugin`);
        }
        const kernel = KernelEnvironment.find();
        if (!kernel) {
            return new Error("Kernel not found");
        }

        const res = await load_iframe_plugin(
            plugin.plugin_descr,
            ident,
            kernel,
            this.element()
        );

        if (res instanceof Error) {
            return res;
        }

        this._descr = {
            type: "iframe",
            iframe: res.iframe,
            ref: res.ref
        };

        return res.ref;
    }

    sync_iframe_position() {
        if (this._descr.type !== "iframe") {
            return;
        }

        const el = this.element();
        const iframe = this._descr.iframe;
        sync_iframe_position(iframe, el);
    }

    clear() {
        const descr = this.descr;
        if (descr.type === "iframe") {
            Canvas.close_iframe_plugin(descr.iframe, descr.ref);
        }

        this._descr = {
            type: "local"
        };
        this.element().innerHTML = "";
    }

    static async close_iframe_plugin(iframe: HTMLIFrameElement, pref: PluginReference) {
        muteIframe(iframe);
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.top = "0";
        iframe.style.left = "0"
        await terminate_plugin(pref);
        iframe.remove();
    }
}

let canvas_generator: () => Canvas | null = () => null;
export function request_canvas() {
    return canvas_generator();
}

export function on_canvas_request(
    cb: () => Canvas | null
) {
    canvas_generator = cb;
}


function createDisposabelDiv(): HTMLDivElement {
    const hiddenDiv = document.createElement("div");

    Object.assign(hiddenDiv.style, {
        position: "absolute",
        width: "0px",
        height: "0px",
        overflow: "hidden",
        opacity: "0",
        pointerEvents: "none",
        zIndex: "-9999",
    });

    document.body.appendChild(hiddenDiv);
    return hiddenDiv;
}

function muteIframe(iframe: HTMLIFrameElement) {
    try {
        iframe.setAttribute("muted", "");
        // iframe.setAttribute("allow", "autoplay; encrypted-media");

        if (iframe.contentWindow) {
            const doc = iframe.contentWindow.document;
            const mediaEls = doc.querySelectorAll("audio, video") as any;
            mediaEls.forEach((el: HTMLMediaElement) => {
                el.muted = true;
                el.volume = 0;
            });
        }
    } catch { /* Cross-Origin */ }
}
