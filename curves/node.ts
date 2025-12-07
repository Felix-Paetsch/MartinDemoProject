import { Failure, Logging, Address } from "pc-messaging-kernel/messaging";
import { NodePlatform } from "pc-messaging-kernel/platform";
import { PluginEnvironment, PsLogging } from "pc-messaging-kernel/pluginSystem";

Failure.setAnomalyHandler((e) => {
    throw e;
});

Failure.setErrorHandler((e) => {
    throw e;
});

Logging.set_logging_target(Address.local_address);
Logging.process_logs_using(PsLogging.log_to_file("./debug/logs/internal_logs.log"))
class KernelImpl extends NodePlatform.KernelEnvironment {
    register_kernel_middleware() {
        this.use_middleware(Logging.log_middleware(), "monitoring");
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        env.use_middleware(Logging.log_middleware(), "monitoring");
    }
}

const kernel = new KernelImpl();
kernel.start();
