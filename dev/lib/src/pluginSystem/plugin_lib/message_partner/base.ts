import { Protocol } from "../../../middleware/protocol";
import { MessagePartnerProtocol } from "../../protocols/message_partner/message_partner_protocol";
import LibraryMessagePartner from "./library";
import PluginMessagePartner from "./plugin_message_partner";

export type MessagePartnerPairDistinguisher = boolean;

export class MessagePartner {
    static message_partners: MessagePartner[] = [];
    readonly pair_distinguisher: MessagePartnerPairDistinguisher;
    constructor(
        readonly pair_uuid: string,
        readonly root_message_partner: PluginMessagePartner | LibraryMessagePartner
    ) {
        this.pair_distinguisher = root_message_partner?.pair_distinguisher;
        MessagePartner.message_partners.push(this);
    }

    get own_uuid(): string {
        return this.pair_uuid + (this.pair_distinguisher ? "_1" : "_0");
    }

    get other_uuid(): string {
        return this.pair_uuid + (this.pair_distinguisher ? "_0" : "_1");
    }

    protected run_message_partner_protocol<
        Responder extends MessagePartner,
        InitData,
        Result
    >(
        protocol: MessagePartnerProtocol<this, Responder, InitData, Result>,
        initData: InitData
    ): Promise<Result | Error> {
        return protocol(this, initData);
    }
}