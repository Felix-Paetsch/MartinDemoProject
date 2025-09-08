import { Middleware as DebugMiddleware, Severity, LogExternal } from "pc-messaging-kernel/debug";
import { Address, LocalAddress } from "pc-messaging-kernel/messaging";
import { Middleware as CommonMiddleware } from "pc-messaging-kernel/pluginSystem/common";
import { KernelEnvironment, PluginReference } from "pc-messaging-kernel/pluginSystem/kernel";
import { LibraryEnvironment } from "pc-messaging-kernel/pluginSystem/library";
import { Bridge, MessagePartner, PluginEnvironment, PluginIdent } from "pc-messaging-kernel/pluginSystem/plugin";
import { callbackToResult, Result, Success } from "pc-messaging-kernel/utils";

const side_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING SIDE PLUGIN >>");
    LogExternal.log({ message: "Side plugin started" });
    env.on_plugin_request((mp: MessagePartner) => {
        mp.on_bridge((bridge: Bridge) => {
            bridge.on((data) => {
                console.log(data + ", and I must scream");
            });
            bridge.on_listener_registered(async (bridge) => {
                await bridge.send("I am here");
            });
        });

        env.log("Hello from side plugin", Severity.INFO);
    });
}

const main_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING MAIN PLUGIN >>")
    const res_1 = await env.get_plugin({
        name: "side",
        version: "1.0.0"
    });
    if (res_1.is_error) {
        console.log(res_1.error.stack!);
        throw res_1.error;
    }

    const mp = res_1.value;
    const res_2: Result<Bridge, Error> = await mp.bridge();
    if (res_2.is_error) {
        throw res_2.error;
    }
    const bridge = res_2.value;

    await bridge.send("I have no mouth");
    bridge.on((data) => {
        console.log(data + ", and I must still scream");
    });
}

class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        this.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        this.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
        this.useMiddleware(LogExternal.middleware(), "monitoring");
        this.useMiddleware(DebugMiddleware.kernel("debug/logs/internal_logs.log"), "monitoring");
    }

    register_plugin_middleware(ref: PluginReference) {
        ref.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        ref.useMiddleware(LogExternal.middleware(), "monitoring");
        ref.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.useMiddleware(LogExternal.middleware(), "monitoring");
        env.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_library_middleware(env: LibraryEnvironment) {
        env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.useMiddleware(LogExternal.middleware(), "monitoring");
        env.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    async create_plugin(plugin_ident: PluginIdent) {
        const name = plugin_ident.name;
        const plugin = name === "start" ? main_plugin : side_plugin;
        const res1 = await this.create_local_plugin_environment(plugin_ident, new LocalAddress(name));
        if (res1.is_error) return res1;
        const { env, ref } = res1.value;
        this.register_plugin_middleware(ref);
        this.register_local_plugin_middleware(env);
        const res2 = await callbackToResult(plugin, env);
        if (res2.is_error) return res2;
        return new Success(ref);
    }
}

Address.setLocalAddress(new LocalAddress("KERNEL"));
LogExternal.clear().then(
    () => new KernelImpl().start()
)//.then(r => console.log(r))

