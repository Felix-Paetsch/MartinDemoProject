import { Failure, Logging, Address } from "pc-messaging-kernel/messaging";
import {
    PluginEnvironment,
    uuidv4,
    LibraryIdent,
    AbstractLibraryImplementation,
    PluginIdent,
    KernelEnvironment,
    LibraryEnvironment,
    PsLogging
} from "pc-messaging-kernel/kernel"

Failure.setAnomalyHandler((e) => {
    throw e;
});

Failure.setErrorHandler((e) => {
    throw e;
});

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
