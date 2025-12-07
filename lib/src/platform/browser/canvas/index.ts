import { KernelEnvironment, PluginIdent, PluginIdentWithInstanceId, PluginReference } from "../../../pluginSystem/exports";
import { is_iframe_plugin } from "../../types";
import { getAPIPlugins } from "../get_plugins/api";
import { load_iframe_plugin } from "./load_iframe_plugin";

export abstract class Canvas {
    abstract element(): HTMLDivElement;
    async load_iframe_plugin(ident: PluginIdentWithInstanceId): Promise<Error | PluginReference> {
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
        return load_iframe_plugin(
            plugin.plugin_descr,
            ident,
            kernel,
            this.element()
        )
    }
    clear() {
        this.element().innerHTML = "";
        throw new Error("what happens with plugin that is loaded into this iframe?");
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
