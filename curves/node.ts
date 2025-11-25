import { Failure, Logging, Address } from "pc-messaging-kernel/messaging";
import {
    PluginEnvironment,
    NodePlatform,
    PsLogging,
} from "pc-messaging-kernel/kernel"

Failure.setAnomalyHandler((e) => {
    throw e;
});

Failure.setErrorHandler((e) => {
    throw e;
});

Logging.set_logging_target(Address.local_address);
PsLogging.start_kernel_log_to_file("./debug/logs/internal_logs.log");
class KernelImpl extends NodePlatform.KernelEnvironment {
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
}

const kernel = new KernelImpl();
kernel.start();
