import { kernelDebugLogging } from "./internal_logging/logging/middleware/kernel_middleware";
import { pluginDebugLogging } from "./internal_logging/logging/middleware/plugin_middleware";
import { Severity } from "./internal_logging/logging/severity";
import LogInvestigator from "./internal_logging/parse/logInverstigator";

export const Middleware = {
    kernel: kernelDebugLogging,
    plugin: pluginDebugLogging
};

export {
    LogInvestigator,
    Severity
};

