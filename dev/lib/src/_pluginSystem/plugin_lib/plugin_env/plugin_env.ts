import { Severity } from "../../../debug/exports";
import { Address } from "../../../messaging/core/address";
import { log } from "../../../middleware/logging";
import { MessagePartner } from "../../../pluginSystem/plugin_lib/_message_partners/message_partner/message_partner";
import { Json } from "../../../utils/json";
import { EnvironmentCommunicator } from "../../common_lib/environments/environment_communicator";
import { PluginIdentWithInstanceId } from "./plugin_ident";

export class PluginEnvironment extends EnvironmentCommunicator {
    constructor(
        readonly port_id: string,
        readonly kernel_address: Address,
        readonly plugin_ident: PluginIdentWithInstanceId
    ) {
        super(port_id);
    }

    message_partners() {
        return MessagePartner.message_partners.filter(
            mp => mp.port === this.port
        );
    }

    log(message: Json, severity: Severity = Severity.INFO) {
        return log(this.kernel_address, {
            severity: severity,
            message: message
        })
    }

    /*
    get_library(library_ident: LibraryIdent): ResultPromise<LibraryMessagePartner, ProtocolError> {
        return get_library.call(this, library_ident);
    };
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
    */
}

// register_get_plugin_command(PluginEnvironment);
// register_remove_plugin_command(PluginEnvironment);