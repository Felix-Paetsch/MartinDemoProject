import { clear_external_logs, log_external, log_external_mw, set_logging_url } from "./external_logging/log_external";
import { kernelDebugLogging } from "./internal_logging/logging/kernel_middleware";
import { pluginDebugLogging } from "./internal_logging/logging/plugin_middleware";
import { Severity } from "./internal_logging/logging/severity";
import LogInvestigator from "./internal_logging/parse/logInverstigator";

export const Middleware = {
    kernel: kernelDebugLogging,
    plugin: pluginDebugLogging
};

export const LogExternal = {
    log: log_external,
    middleware: log_external_mw,
    clear: clear_external_logs,
    set_logging_url: set_logging_url,
}

export {
    LogInvestigator,
    Severity
};

