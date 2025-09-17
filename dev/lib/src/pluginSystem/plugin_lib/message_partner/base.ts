import { MessagePartnerProtocol } from "../../protocols/message_partner/message_partner_protocol";
import LibraryMessagePartner from "./library";
import PluginMessagePartner from "./plugin_message_partner";
import { Json } from "./../../../utils/json";
import { send_message } from "../../protocols/message_partner/send_message";

export type MessagePartnerPairDistinguisher = boolean;

export class MessagePartner {
    static message_partners: MessagePartner[] = [];

    readonly pair_distinguisher: MessagePartnerPairDistinguisher;
    private removed = false;
    constructor(
        readonly pair_uuid: string,
        readonly root_message_partner: PluginMessagePartner | LibraryMessagePartner
    ) {
        this.pair_distinguisher = root_message_partner?.pair_distinguisher;
        MessagePartner.message_partners.push(this);
    }

    get is_removed() {
        return this.removed
    }

    get own_uuid(): string {
        return this.pair_uuid + (this.pair_distinguisher ? "_1" : "_0");
    }

    get other_uuid(): string {
        return this.pair_uuid + (this.pair_distinguisher ? "_0" : "_1");
    }

    remove() {
        if (this.is_removed) return;
        this.removed = true;
        this.#send_message_partner_message("remove");
        this.#internal_remove();
    }
    #internal_remove() {

    }

    _trigger_on_message_partner_message(msg: Json) {
        if (msg === "remove") {
            return this.#internal_remove();
        }
    }
    #send_message_partner_message(msg: Json) {
        this.run_message_partner_protocol(send_message, msg);
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
