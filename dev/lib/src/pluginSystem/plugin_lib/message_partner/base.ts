import { MessagePartnerProtocol } from "../../protocols/message_partner/message_partner_protocol";
import LibraryMessagePartner from "./library";
import PluginMessagePartner from "./plugin_message_partner";
import { Json } from "./../../../utils/json";
import { send_message } from "../../protocols/message_partner/send_message";
import { promisify } from "util";

export type MessagePartnerPairDistinguisher = boolean;

export class MessagePartner {
    static message_partners: MessagePartner[] = [];

    readonly pair_distinguisher: MessagePartnerPairDistinguisher;
    readonly children: MessagePartner[] = [];
    private removed = false;
    constructor(
        readonly pair_uuid: string,
        readonly root_message_partner: PluginMessagePartner | LibraryMessagePartner,
        readonly parent: MessagePartner | null = null
    ) {
        this.pair_distinguisher = root_message_partner?.pair_distinguisher || false;
        MessagePartner.message_partners.push(this);
        if (parent) {
            parent.children.push(this);
        }
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
        this._internal_remove();
    }
    async _internal_remove(trigger_callback = true) {
        if (this.is_removed) return;
        this.removed = true;
        const index = MessagePartner.message_partners.findIndex(
            m => m === this
        );
        if (index < 0) return;
        MessagePartner.message_partners.splice(index, 1);
        this.children.forEach(mp => {
            mp._internal_remove(false);
        });
        if (trigger_callback) {
            return await this.on_remove_cb().catch();
        }
        return;
    }
    private on_remove_cb: () => Promise<void> = () => Promise.resolve();
    on_remove(cb: () => void | Promise<void>) {
        this.on_remove_cb = promisify(cb);
    }


    _trigger_on_message_partner_message(msg: Json) {
        if (msg === "remove") {
            return this._internal_remove();
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
        if (this.is_removed) return Promise.resolve(
            new Error("Message partner is removed")
        );
        return protocol(this, initData);
    }
}
