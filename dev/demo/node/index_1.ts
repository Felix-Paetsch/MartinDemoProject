import { Failure, Logging, Address } from "../../lib/src/messaging/exports";
import {
    PluginEnvironment,
    LibraryReference,
    PluginMessagePartner,
    uuidv4,
    LibraryIdent,
    AbstractLibraryImplementation,
    PluginIdent,
    KernelEnvironment,
    LibraryEnvironment,
    PsLogging
} from "../../lib/src/pluginSystem/kernel_exports"
import BranchedMessagePartner from "../../lib/src/pluginSystem/plugin_lib/message_partner/branched_message_partner";

Failure.setAnomalyHandler((e) => {
    throw e;
});

Failure.setErrorHandler((e) => {
    throw e;
});

const side_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING SIDE PLUGIN >>");
    env.on_plugin_request((mp: PluginMessagePartner) => {
        mp.on_branch((branch: BranchedMessagePartner) => {
            branch.on_message((data) => {
                console.log(data + ", and I must scream");
            });
            branch.on_message_listener_registered(async (bridge) => {
                await bridge.send_message("I am here");

                env.on_remove(() => {
                    console.log("Removing self");
                });
                env.remove_self();
            });
        });

        env.log("Hello from side plugin", PsLogging.Severity.INFO);
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

    const br = await mp.branch();
    if (br instanceof Error) {
        throw br;
    }

    await br.send_message("I have no mouth");
    br.on_message((data) => {
        console.log(data + ", and I must still scream");
    });
}

let lib_ref: LibraryReference | null = null;


Logging.set_logging_target(Address.local_address);
PsLogging.start_kernel_log_to_file("./debug/logs/internal_logs.log");
class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        //this.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        //this.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
        this.use_middleware(Logging.log_middleware(), "monitoring");
        //this.useMiddleware(DebugMiddleware.kernel("debug/logs/internal_logs.log"), "monitoring");
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
kernel.start();
