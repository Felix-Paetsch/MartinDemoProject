import { Effect } from "effect";
import { Severity } from "../../../debug/exports";
import { Address } from "../../../messaging/base/address";
import { log } from "../../../messaging/middleware/logging";
import { ProtocolError } from "../../../messaging/protocols/base/protocol_errors";
import { CallbackError } from "../../../utils/boundary/callbacks";
import { ResultPromise } from "../../../utils/boundary/result";
import { Json } from "../../../utils/json";
import { EnvironmentCommunicator } from "../../common_lib/env_communication/environment_communicator";
import { Environment } from "../../common_lib/messageEnvironments/environment";
import { MPOCommunicationProtocol } from "../message_partners/base/mpo_commands/mpo_communication/protocol";
import { PluginMessagePartner } from "../message_partners/plugin";
import applyGetPluginPrototypeModifier from "./commands/get_plugin";
import applySendKernelMessagePrototypeModifier from "./commands/kernel_message";
import applyRemovePluginPrototypeModifier from "./commands/remove_plugin";
import { PluginIdent, PluginIdentWithInstanceId } from "./plugin_ident";

export class PluginEnvironment extends EnvironmentCommunicator {
    constructor(
        readonly env: Environment,
        readonly kernel_address: Address,
        readonly plugin_ident: PluginIdentWithInstanceId
    ) {
        super(env);
        this.command_prefix = "PLUGIN";

        Effect.gen(this, function* () {
            const mw = new MPOCommunicationProtocol(env).middleware();
            this.useMiddleware(mw, "listeners");
        }).pipe(Effect.runSync);
    }

    log(message: Json, severity: Severity = Severity.INFO) {
        log(this.kernel_address, {
            severity: severity,
            message: message
        }).pipe(Effect.runPromise);
    }

    get_plugin(plugin_ident: PluginIdent): ResultPromise<PluginMessagePartner, ProtocolError> { throw new Error("Method not implemented."); };
    on_plugin_request(cb: (mp: PluginMessagePartner, data?: Json) => void): void { throw new Error("Method not implemented."); };
    _on_plugin_request(mp: PluginMessagePartner, data?: Json): Effect.Effect<void, CallbackError> { throw new Error("Method not implemented."); };
    send_kernel_message(command: string, data: Json): void { throw new Error("Method not implemented."); };
    remove_self(data?: Json): Promise<void> { throw new Error("Method not implemented."); };
    on_remove(cb: (data: Json) => Promise<void>): void { throw new Error("Method not implemented."); };
    __remove_cb(data: Json): Promise<void> { throw new Error("Method not implemented."); };
}


applyGetPluginPrototypeModifier(PluginEnvironment)
applyRemovePluginPrototypeModifier(PluginEnvironment)
applySendKernelMessagePrototypeModifier(PluginEnvironment)