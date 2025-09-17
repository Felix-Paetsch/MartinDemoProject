import { PluginEnvironment } from "../../lib/src/pluginSystem/plugin_lib/plugin_environment";
import { KernelEnvironment } from "../../lib/src/pluginSystem/kernel_lib/kernel_env";
import { PluginIdent } from "../../lib/src/pluginSystem/plugin_lib/plugin_ident";
import { v4 as uuidv4 } from "uuid";
import { LibraryReference } from "../../lib/src/pluginSystem/kernel_lib/external_references/library_reference";
import { LibraryEnvironment, LibraryIdent } from "../../lib/src/pluginSystem/library/library_environment";
import { AbstractLibraryImplementation } from "../../lib/src/pluginSystem/library/library_implementation";
import PluginMessagePartner from "../../lib/src/pluginSystem/plugin_lib/message_partner/plugin_message_partner";
import Bridge from "../../lib/src/pluginSystem/plugin_lib/message_partner/bridge";
import { Failure, Logging, Address } from "../../lib/src/messaging/exports";
import { start_kernel_log_to_file } from "../../lib/src/pluginSystem/debug/logging";
import { PluginReference } from "../../lib/src/pluginSystem/kernel_lib/external_references/plugin_reference";
import { Severity } from "../../lib/src/pluginSystem/debug/severity";

Failure.setAnomalyHandler((e) => {
    throw e;
});

Failure.setErrorHandler((e) => {
    throw e;
});

const side_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING SIDE PLUGIN >>");
    env.on_plugin_request((mp: PluginMessagePartner) => {
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

    const lib = await env.get_library({
        name: "test",
        version: "1.0.0"
    });
    if (lib instanceof Error) {
        console.log("This is an error");
        throw lib;
    }
    const res = await lib.call("hi", ["Martin"]);
    console.log(res);
}

const main_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING MAIN PLUGIN >>")
    const mp = await env.get_plugin({
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


Logging.set_logging_target(Address.local_address);
start_kernel_log_to_file("./debug/logs/internal_logs.log");
class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        //this.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        //this.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
        this.use_middleware(Logging.log_middleware(), "monitoring");
        //this.useMiddleware(DebugMiddleware.kernel("debug/logs/internal_logs.log"), "monitoring");
    }

    register_plugin_middleware(ref: PluginReference) {
        //ref.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        ref.use_middleware(Logging.log_middleware(), "monitoring");
        //ref.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        // env.use_middleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.use_middleware(Logging.log_middleware(), "monitoring");
        //env.use_middleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_library_middleware(env: LibraryEnvironment) {
        //env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.use_middleware(Logging.log_middleware(), "monitoring");
        //env.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    async create_library(library_ident: LibraryIdent) {
        const lib = AbstractLibraryImplementation.from_object({
            "hi": (name: string) => `Hello ${name}`
        }, () => {
            console.log("Library disposed");
            lib_ref = null;
        });
        const { ref } = this.create_local_library_environment(library_ident, lib);
        this.register_library_middleware(ref);
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
        this.register_plugin_middleware(ref);

        await plugin(env);
        return ref;
    }
}

const kernel = new KernelImpl();
kernel.start();
