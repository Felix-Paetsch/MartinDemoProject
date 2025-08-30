import { LibraryIdent } from "pc-messaging-kernel/pluginSystem/plugin_lib/message_partners/library";
import { Middleware as DebugMiddleware } from "../debug/exports";
import { pluginDebugLogging } from "../debug/logging/create/plugin_middleware";
import { Address, LocalAddress, Message } from "../messaging/exports";
import { Middleware as CommonMiddleware } from "../pluginSystem/common_lib/exports";
import { KernelEnvironment, PluginReference } from "../pluginSystem/kernel_lib/exports";
import { AbstractLibraryImplementation } from "../pluginSystem/library/library_implementation";
import { PluginEnvironment, PluginIdent } from "../pluginSystem/plugin_lib/exports";
import { callbackAsResult, Json, Success } from "../utils/exports";


const main_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING MAIN PLUGIN >>")
    const res_1 = await env.get_library({
        name: "side",
        version: "1.0.0"
    });
    if (res_1.is_error) {
        console.log(res_1.error.stack!);
        throw res_1.error;
    }

    const lib = res_1.value;
    const exp = await lib.exposed_functions();
    console.log(exp);
    const res2 = await lib.call("tes2t");
    console.log(res2);
}

class LibraryImpl extends AbstractLibraryImplementation {
    exposes(msg: Message): string[] {
        return ["test"];
    }

    call(fn: string, args: readonly Json[], msg: Message): Json | Promise<Json> {
        return "test";
    }
}

class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        this.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        this.useMiddleware(pluginDebugLogging(this.address), "monitoring");
        this.useMiddleware(DebugMiddleware.kernel("src/debug/logging/logs/logs.log"), "monitoring");
    }

    register_plugin_middleware(ref: PluginReference) {
        ref.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        ref.useMiddleware(pluginDebugLogging(this.address), "monitoring");
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.useMiddleware(pluginDebugLogging(this.address), "monitoring");
    }

    async create_library(library_ident: LibraryIdent) {
        return await this.create_local_library(library_ident, new LibraryImpl());
    }

    async create_plugin(plugin_ident: PluginIdent) {
        const name = plugin_ident.name;
        const plugin = name === "START" ? main_plugin : main_plugin;
        const res1 = await this.create_local_plugin_environment(new LocalAddress(name), plugin_ident);
        if (res1.is_error) return res1;
        const { env, ref } = res1.value;
        this.register_plugin_middleware(ref);
        this.register_local_plugin_middleware(env);
        const res2 = await callbackAsResult(plugin)(env);
        if (res2.is_error) return res2;
        return new Success(ref);
    }
}

Address.setLocalAddress(new LocalAddress("KERNEL"));
new KernelImpl().start();