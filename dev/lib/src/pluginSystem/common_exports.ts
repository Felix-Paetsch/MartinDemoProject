export * from "../utils/json"

import * as PluginStuff from "../pluginSystem/plugin_lib/plugin_ident";
export type PluginIdent = PluginStuff.PluginIdent;
export type PluginIdentWithInstanceId = PluginStuff.PluginIdentWithInstanceId;

import { LibraryIdent } from "./library/library_environment";
export {
    type LibraryIdent
}

import * as LoggingStuff from "../pluginSystem/debug/logging";
import { Severity as _Severity } from "./debug/severity";
import { prevent_loops } from "./common_lib/middleware/prevent_loops";

import uuidv4 from "../utils/uuid";
export {
    uuidv4
}

export namespace PsLogging {
    export const Severity = _Severity;
    export type Severity = _Severity;
    export const init_external_logging = LoggingStuff.init_external_logging;
    export const start_kernel_log_to_file = LoggingStuff.start_kernel_log_to_file;
}

export namespace PsMiddleware {
    export const PreventLoops = prevent_loops
}

import * as InitPluginSide from "./common_lib/initialization/pluginSide";
import * as InitKernelSide from "./common_lib/initialization/kernelSide";
import * as InitSync from "./common_lib/initialization/synchronizer";
import { PluginEnvironment } from "./plugin_exports";
export namespace Initialization {
    export const pluginSide = InitPluginSide.initializeExternalPlugin_PluginSide;
    export const kernelSide = InitKernelSide.initializeExternalPlugin_KernelSide;
    export type MessageChannel = InitSync.PrimitiveMessageChannel;
}
