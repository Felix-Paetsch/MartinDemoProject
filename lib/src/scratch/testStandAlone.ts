import { Middleware as DebugMiddleware, Severity } from "../debug/exports";
import { pluginDebugLogging } from "../debug/internal_logging/logging/middleware/plugin_middleware";
import { Address, LocalAddress } from "../messaging/exports";
import { Middleware as CommonMiddleware } from "../pluginSystem/common_lib/exports";
import { KernelEnvironment, PluginReference } from "../pluginSystem/kernel_lib/exports";
import { Bridge, MessagePartner, PluginEnvironment, PluginIdent } from "../pluginSystem/plugin_lib/exports";
import { callbackToResult, Success } from "../utils/exports";

const side_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING SIDE PLUGIN >>")
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
    const res_2 = await mp.bridge();
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

    async create_plugin(plugin_ident: PluginIdent) {
        const name = plugin_ident.name;
        const plugin = name === "start" ? main_plugin : side_plugin;
        const res1 = await this.create_local_plugin_environment(new LocalAddress(name), plugin_ident);
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
new KernelImpl().start();