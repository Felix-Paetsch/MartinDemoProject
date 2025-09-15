import { Json } from "../../../utils/json";
import { PluginDescriptor, PluginEnvironment } from "../plugin_environment";
import { MessagePartner } from "./base";
import Bridge from "./bridge";
import { executeProtocol, Protocol, ProtocolError } from "../../../middleware/protocol";
import { create_bridge_protocol } from "../../protocols/plugin_plugin/bridge/create_bridge";

export type PluginMessagePartnerID = string;
export default class PluginMessagePartner extends MessagePartner {
    readonly bridges: Bridge[] = [];
    constructor(
        readonly plugin_descriptor: PluginDescriptor,
        readonly uuid: PluginMessagePartnerID,
        readonly env: PluginEnvironment,
    ) {
        super();
        env.plugin_message_partners.push(this);
    }

    bridge(): Promise<Bridge | Error> {
        return this.#execute_plugin_message_partner_protocol(create_bridge_protocol, null);
    }
    private on_bridge_request_cb: (bridge: Bridge) => Promise<void> = () => Promise.resolve();
    on_bridge(cb: (bridge: Bridge) => void | Promise<void>): void {
        this.on_bridge_request_cb = (bridge) => Promise.resolve(cb(bridge));
    };
    async _trigger_on_bridge_request(bridge: Bridge, data?: Json): Promise<void | Error> {
        try {
            return await this.on_bridge_request_cb(bridge).catch(e => e);
        } catch (e) {
            return e as Error;
        }
    };

    #execute_plugin_message_partner_protocol<Result, InitData>(
        protocol: Protocol<PluginMessagePartner, PluginMessagePartner, Result, InitData, {
            plugin_message_partner_uuid: PluginMessagePartnerID,
            plugin_instance_id: string
        }>,
        initData: InitData
    ): Promise<Result | ProtocolError> {
        return executeProtocol(
            protocol,
            this,
            this.plugin_descriptor.address,
            this.env.port,
            {
                plugin_message_partner_uuid: this.uuid,
                plugin_instance_id: this.plugin_descriptor.plugin_ident.instance_id
            },
            initData
        );
    }
}
