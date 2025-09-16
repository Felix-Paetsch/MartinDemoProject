import { Json } from "../../../utils/json";
import { MessagePartner } from "./base";
import PluginMessagePartner, { PluginMessagePartnerID } from "./plugin_message_partner";
import { Protocol } from "../../../middleware/protocol";
import { send_bridge_protocol } from "../../protocols/message_partner/bridge/send_bridge";
import { trigger_on_listener_registered } from "../../protocols/message_partner/bridge/listener_registered";

export default class Bridge extends MessagePartner {
    constructor(
        readonly plugin_partner: PluginMessagePartner,
        readonly uuid: string
    ) {
        super(uuid, plugin_partner);
    }

    send(data: Json) {
        return this.run_message_partner_protocol(send_bridge_protocol, data);
    }

    __on_message_cb: (data: Json) => Promise<void> = () => Promise.resolve();
    on(cb: (data: Json) => void) {
        this.__on_message_cb = (data) => Promise.resolve(cb(data));
        this.run_message_partner_protocol(trigger_on_listener_registered, null);
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
}
