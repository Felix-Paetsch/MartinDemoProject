import { Failure, Logging } from "pc-messaging-kernel/messaging";
import {
    PluginEnvironment,
    BrowserPlatform
} from "pc-messaging-kernel/kernel"

Failure.setAnomalyHandler((e) => {
    throw e;
});

Failure.setErrorHandler((e) => {
    throw e;
});


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

setTimeout(() => {
    const kernel = new KernelImpl();
    kernel.start();
}, 400)

