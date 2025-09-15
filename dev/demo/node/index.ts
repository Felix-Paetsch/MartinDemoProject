import { Severity } from "../../lib/src/debug/exports";
import { clear_external_logs } from "../../lib/src/debug/external_logging/log_external";
import { PluginEnvironment } from "../../lib/src/pluginSystem/plugin_lib/plugin_environment";
import { KernelEnvironment } from "../../lib/src/pluginSystem/kernel_lib/kernel_env";
import { PluginIdent } from "../../lib/src/pluginSystem/plugin_lib/plugin_ident";
import { v4 as uuidv4 } from "uuid";
import { LibraryReference } from "../../lib/src/pluginSystem/kernel_lib/external_references/library_reference";
import { LibraryIdent } from "../../lib/src/pluginSystem/library/library_environment";
import { AbstractLibraryImplementation } from "../../lib/src/pluginSystem/library/library_implementation";
import PluginMessagePartner from "../../lib/src/pluginSystem/plugin_lib/message_partner/plugin_message_partner";
import { ProtocolError } from "../../lib/src/middleware/protocol";
import Bridge from "../../lib/src/pluginSystem/plugin_lib/message_partner/bridge";

const side_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING SIDE PLUGIN >>");
    env.on_plugin_request((mp: PluginMessagePartner) => {
        mp.on_bridge((bridge: Bridge) => {
            bridge.on((data) => {
                console.log(data + ", and I must scream");
            });
            bridge.on_listener_registered(async (bridge) => {
                await bridge.send("Iqq am here");
            });
        });

        env.log("Hello from side plugin", Severity.INFO);
    });

    const lib = await env.get_library({
        name: "test",
        version: "1.0.0"
    });
    if (lib.is_error) {
        console.log("This is an error");
        throw lib.error;
    }
    const res = await lib.value.call("hi", ["Martin"]);
    console.log(res);
}

const main_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING MAIN PLUGIN >>")
    const mp: PluginMessagePartner | ProtocolError = await env.get_plugin({
        name: "side",
        version: "1.0.0"
    });

    if (mp instanceof Error) {
        console.log("THROWING");
        throw mp;
    }

    const br = await mp.bridge();
    if (br instanceof Error) {
        throw br;
    }

    await br.send("I have no mouth");
    br.on((data) => {
        console.log(data + ", and I must still scream");
    });
}

let lib_ref: LibraryReference | null = null;

class KernelImpl extends KernelEnvironment {
    /*register_kernel_middleware() {
        this.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        this.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
        this.useMiddleware(log_external_mw(), "monitoring");
        this.useMiddleware(DebugMiddleware.kernel("debug/logs/internal_logs.log"), "monitoring");
    }

    register_plugin_middleware(ref: PluginReference) {
        ref.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        ref.useMiddleware(log_external_mw(), "monitoring");
        ref.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.useMiddleware(log_external_mw(), "monitoring");
        env.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_library_middleware(env: LibraryEnvironment) {
        env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.useMiddleware(log_external_mw(), "monitoring");
        env.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }*/

    async create_library(library_ident: LibraryIdent) {
        const lib = AbstractLibraryImplementation.from_object({
            "hi": (name: string) => `Hello ${name}`
        }, () => {
            console.log("Library disposed");
            lib_ref = null;
        });
        const { ref } = this.create_local_library_environment(library_ident, lib);
        return ref;
    }

    async create_plugin(plugin_ident: PluginIdent) {
        const ident_with_id = {
            instance_id: uuidv4(),
            ...plugin_ident
        }

        const name = plugin_ident.name;
        const plugin = name === "start" ? main_plugin : side_plugin;

        const { env, ref } = this.create_local_plugin_environment(ident_with_id);
        await plugin(env);
        return ref;
    }
}

const kernel = new KernelImpl();
clear_external_logs()?.then(
    () => kernel.start()
).then(r => {
    kernel.remove_library(lib_ref!)
});

