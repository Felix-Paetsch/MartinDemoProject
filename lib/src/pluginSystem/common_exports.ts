import * as PluginStuff from "./plugin_lib/plugin_ident";
export type PluginIdent = PluginStuff.PluginIdent;
export type PluginIdentWithInstanceId = PluginStuff.PluginIdentWithInstanceId;

import * as LoggingStuff from "../pluginSystem/debug/logging";
import { Severity as _Severity } from "./debug/severity";
import { prevent_loops } from "./common_lib/middleware/prevent_loops";

export namespace PsLogging {
    export const Severity = _Severity;
    export type Severity = _Severity;
    export const log_to_file = LoggingStuff.log_to_file;
}

export namespace PsMiddleware {
    export const PreventLoops = prevent_loops
}

import * as InitPluginSide from "./platform/browser/iframe/initialization/pluginSide";
import * as InitKernelSide from "./platform/browser/iframe/initialization/kernelSide";
import * as InitSync from "./platform/browser/iframe/initialization/synchronizer";
export namespace Initialization {
    export const pluginSide = InitPluginSide.initializeExternalPlugin_PluginSide;
    export const kernelSide = InitKernelSide.initializeExternalPlugin_KernelSide;
    export type MessageChannel = InitSync.PrimitiveMessageChannel;
}
