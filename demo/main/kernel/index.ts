import { Effect } from "effect";
import { Middleware as DebugMiddleware, LogInvestigator } from "pc-messaging-kernel/debug";
import { LocalAddress } from "pc-messaging-kernel/messaging";
import { Middleware as CommonMiddleware } from "pc-messaging-kernel/pluginSystem/common";
import { KernelEnvironment, PluginReference } from "pc-messaging-kernel/pluginSystem/kernel";
import { PluginEnvironment, PluginIdent, PluginIdentWithInstanceId } from "pc-messaging-kernel/pluginSystem/plugin";
import { runEffectAsPromise } from "pc-messaging-kernel/utils";
import { v4 as uuidv4 } from 'uuid';
import { createIframePlugin } from "./iframe_plugin";
import { createLocalPlugin, isLocalPlugin } from "./local_plugin";
import { createJSWASMPlugin, isJSWASMPlugin } from "./wasm/js_wasm_plugin";

declare global {
    var logInverstigator: LogInvestigator;
}

export class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        this.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        this.useMiddleware(CommonMiddleware.preventLoops, "preprocessing");
        this.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");

        globalThis.logInverstigator = new LogInvestigator();
        this.useMiddleware(globalThis.logInverstigator.middleware(), "listeners");
    }

    register_plugin_middleware(ref: PluginReference) {
        ref.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        ref.useMiddleware(CommonMiddleware.preventLoops, "preprocessing");
        ref.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.useMiddleware(CommonMiddleware.preventLoops, "preprocessing");
        env.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    create_plugin(plugin_ident: PluginIdent) {
        return Effect.gen(this, function* () {
            const new_ident = {
                instance_id: uuidv4(),
                ...plugin_ident
            }
            const address = new LocalAddress(plugin_ident.name + "_" + new_ident.instance_id);
            if (yield* isLocalPlugin(plugin_ident)) {
                return yield* createLocalPlugin(this, new_ident, address)
            } else if (yield* isJSWASMPlugin(plugin_ident)) {
                const r = yield* createJSWASMPlugin(this, new_ident, address);
                return r;
            }
            return yield* createIframePlugin(this, new_ident, address)
        }).pipe(runEffectAsPromise)
    }

    on_kernel_message(command: string, data: any, plugin_ident: PluginIdentWithInstanceId) {
        if (data && command === "close") {
            const ref = this.get_plugin_reference(data.instance_id);
            if (ref) {
                this.remove_plugin(ref);
            }
        }
    }
}