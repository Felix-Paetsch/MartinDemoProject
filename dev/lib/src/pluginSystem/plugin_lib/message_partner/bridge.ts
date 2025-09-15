import { Json } from "../../../utils/json";
import { MessagePartner } from "./base";
import PluginMessagePartner, { PluginMessagePartnerID } from "./plugin_message_partner";
import { executeProtocol, Protocol, ProtocolError } from "../../../middleware/protocol";
import { send_bridge_protocol } from "../../protocols/plugin_plugin/bridge/send_bridge";
import { trigger_on_listener_registered } from "../../protocols/plugin_plugin/bridge/listener_registered";

export default class Bridge extends MessagePartner {
    constructor(
        readonly plugin_partner: PluginMessagePartner,
        readonly uuid: string
    ) {
        super();
        this.plugin_partner.bridges.push(this);
    }

    send(data: Json) {
        return this.#execute_bridge_protocol(send_bridge_protocol, data);
    }

    __on_message_cb: (data: Json) => Promise<void> = () => Promise.resolve();
    on(cb: (data: Json) => void) {
        this.__on_message_cb = (data) => Promise.resolve(cb(data));
        this.#execute_bridge_protocol(trigger_on_listener_registered, null);
    }
    _trigger_on_message(data: Json) {
        return this.__on_message_cb(data);
    }

    __on_listener_registered_cb: (b: Bridge) => Promise<void> = () => Promise.resolve();
    on_listener_registered(cb: (b: Bridge) => void) {
        this.__on_listener_registered_cb = (b) => Promise.resolve(cb(b));
    }
    _trigger_on_listener_registered(b: Bridge) {
        return this.__on_listener_registered_cb(b);
    }

    #execute_bridge_protocol<Result, InitData>(
        protocol: Protocol<Bridge, Bridge, Result, InitData, {
            plugin_message_partner_uuid: PluginMessagePartnerID,
            plugin_instance_id: string,
            bridge_uuid: string
        }>,
        initData: InitData
    ): Promise<Result | ProtocolError> {
        return executeProtocol(
            protocol,
            this,
            this.plugin_partner.plugin_descriptor.address,
            this.plugin_partner.env.port,
            {
                plugin_message_partner_uuid: this.plugin_partner.uuid,
                plugin_instance_id: this.plugin_partner.plugin_descriptor.plugin_ident.instance_id,
                bridge_uuid: this.uuid
            },
            initData
        );
    }
}
