import { Failure, Logging } from "pc-messaging-kernel/messaging";
import { BrowserPlatform } from "pc-messaging-kernel/platform";
import {
    PluginEnvironment
} from "pc-messaging-kernel/pluginSystem"

Failure.setAnomalyHandler((e) => {
    console.log("Throwing Anomaly", e.message)
    throw e;
});

Failure.setErrorHandler((e) => {
    console.log("Throwing Error", e.message)
    throw e;
});

Logging.process_logs_using(
    (log) => {
        Logging.LogInvestigator.GlobalInstance().collect_logs()(log);
        // Logging.log_to_url("http://localhost:3005/logging")(log);
    }
)
class KernelImpl extends BrowserPlatform.KernelEnvironment {
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

BrowserPlatform.declare_local_environment();

setTimeout(() => {
    const kernel = new KernelImpl();
    kernel.start();
}, 400)

