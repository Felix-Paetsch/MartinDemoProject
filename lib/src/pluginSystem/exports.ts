import * as PluginStuff from "./plugin_side/plugin_ident";
export type PluginIdent = PluginStuff.PluginIdent;
export type PluginIdentWithInstanceId = PluginStuff.PluginIdentWithInstanceId;

import * as LoggingStuff from "../pluginSystem/debug/logging";
import { Severity as _Severity } from "./debug/severity";
import { prevent_loops } from "./common/middleware/prevent_loops";

export namespace PsLogging {
    export const Severity = _Severity;
    export type Severity = _Severity;
    export const log_to_file = LoggingStuff.log_to_file;
}

export namespace PsMiddleware {
    export const PreventLoops = prevent_loops
}

import * as InitPluginSide from "../platform/browser/iframe/initialization/pluginSide";
import * as InitKernelSide from "../platform/browser/iframe/initialization/kernelSide";
import * as InitSync from "../platform/browser/iframe/initialization/synchronizer";
export namespace Initialization {
    export const pluginSide = InitPluginSide.initializeExternalPlugin_PluginSide;
    export const kernelSide = InitKernelSide.initializeExternalPlugin_KernelSide;
    export type MessageChannel = InitSync.PrimitiveMessageChannel;
}

import { MessagePartner } from "./plugin_side/message_partner/base";
import PluginMessagePartner from "./plugin_side/message_partner/plugin_message_partner";
import BranchedMessagePartner from "./plugin_side/message_partner/branched_message_partner";

export {
    PluginMessagePartner,
    MessagePartner,
    BranchedMessagePartner
}

import { PluginEnvironment } from "./plugin_side/plugin_environment";
export {
    PluginEnvironment
}
export type Plugin = (env: PluginEnvironment) => void | Promise<void>;
export { KernelEnvironment, type GetPluginError } from "./kernel_side/kernel_env";
export { ExternalReference } from "./kernel_side/external_references/external_reference";
export { PluginReference } from "./kernel_side/external_references/plugin_reference";
