import { Json } from "../../../utils/json";
import { PluginDescriptor, PluginEnvironment } from "../plugin_environment";
import { MessagePartner, MessagePartnerPairDistinguisher } from "./base";
import { Protocol } from "../../../middleware/protocol";
import BranchedMessagePartner from "./branched_message_partner";

export type PluginMessagePartnerID = string;
export default class PluginMessagePartner extends BranchedMessagePartner {
    constructor(
        readonly plugin_descriptor: PluginDescriptor,
        pair_distinguisher: MessagePartnerPairDistinguisher,
        readonly uuid: PluginMessagePartnerID,
        private _env: PluginEnvironment,
    ) {
        super(uuid, null as any);

        (this as any).pair_distinguisher = pair_distinguisher;
        (this as any).root_message_partner = this;

        this._env.plugin_message_partners.push(this);
    }

    get env() {
        return this._env;
    }

    get address() {
        return this.plugin_descriptor.address;
    }

    get plugin_ident() {
        return this.plugin_descriptor.plugin_ident
    }

    copy() {
        return this.env.get_plugin(this.plugin_ident);
    }
}
