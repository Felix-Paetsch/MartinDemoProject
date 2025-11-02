import { PluginDescriptor, PluginEnvironment } from "../plugin_environment";
import { MessagePartner, MessagePartnerPairDistinguisher } from "./base";
import PluginMessagePartner from "./plugin_message_partner";
import { Json, uuidv4 } from "../../common_exports";
import { promisify } from "../../../utils/exports";

export default class BranchedMessagePartner extends MessagePartner {
    constructor(
        uuid: string,
        readonly parent: BranchedMessagePartner,
    ) {
        super(uuid, parent?.root_message_partner, parent);
    }

    get address() {
        return this.root_message_partner.address;
    }

    get plugin_ident() {
        return (this.root_message_partner as PluginMessagePartner).plugin_ident
    }

    async _trigger_on_message_partner_message(type: string, data: Json): Promise<boolean> {
        const res = await super._trigger_on_message_partner_message(type, data);
        if (res) return res;
        if (type === "branch" && typeof data === "string") {
            const b = new BranchedMessagePartner(data, this);
            await this._on_branch_cb(b);
            return true;
        }
        return false;
    }

    _on_branch_cb: (b: BranchedMessagePartner) => Promise<void> = () => Promise.resolve()
    on_branch(cb: (b: BranchedMessagePartner) => void | Promise<void>) {
        this._on_branch_cb = promisify(cb);
    }
    async branch() {
        const uuid = uuidv4();
        const b = new BranchedMessagePartner(uuid, this);
        const res = await this._send_message_partner_message("branch", uuid, true);
        if (res instanceof Error) {
            await b._internal_remove(false);
            return res as Error;
        }
        return b;
    }

    copy() {
        return this.parent.branch();
    }
}
