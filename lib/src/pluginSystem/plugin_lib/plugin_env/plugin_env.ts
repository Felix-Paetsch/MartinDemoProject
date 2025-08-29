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
import { _on_plugin_request_impl, get_plugin_impl, on_plugin_request_impl, register_get_plugin_command } from "./commands/get_plugin";
import { send_kernel_message_impl } from "./commands/kernel_message";
import { __remove_cb_impl, on_remove_impl, register_remove_plugin_command, remove_self_impl } from "./commands/remove_plugin";
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

        // Register command handlers
        register_get_plugin_command(PluginEnvironment);
        register_remove_plugin_command(PluginEnvironment);
    }

    log(message: Json, severity: Severity = Severity.INFO) {
        log(this.kernel_address, {
            severity: severity,
            message: message
        }).pipe(Effect.runPromise);
    }

    get_plugin(plugin_ident: PluginIdent): ResultPromise<PluginMessagePartner, ProtocolError> {
        return get_plugin_impl.call(this, plugin_ident);
    };
    on_plugin_request(cb: (mp: PluginMessagePartner, data?: Json) => void): void {
        return on_plugin_request_impl.call(this, cb);
    };
    _on_plugin_request(mp: PluginMessagePartner, data?: Json): Effect.Effect<void, CallbackError> {
        return _on_plugin_request_impl.call(this, mp, data);
    };
    send_kernel_message(command: string, data: Json) {
        return send_kernel_message_impl.call(this, command, data);
    };
    remove_self(data?: Json): Promise<void> {
        return remove_self_impl.call(this, data);
    };
    on_remove(cb: (data: Json) => Promise<void>): void {
        return on_remove_impl.call(this, cb);
    };
    __remove_cb(data: Json): Promise<void> {
        return __remove_cb_impl.call(this, data);
    };
}