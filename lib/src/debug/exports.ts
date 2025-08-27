import { kernelDebugLogging } from "./logging/create/kernel_middleware";
import { pluginDebugLogging } from "./logging/create/plugin_middleware";
import { Severity } from "./logging/create/severity";
import LogInvestigator from "./logging/parse/logInverstigator";

export const Middleware = {
    kernel: kernelDebugLogging,
    plugin: pluginDebugLogging
};

export {
    LogInvestigator,
    Severity
};

