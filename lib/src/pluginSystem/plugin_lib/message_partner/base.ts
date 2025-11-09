import { MessagePartnerProtocol } from "../../protocols/message_partner/message_partner_protocol";
import LibraryMessagePartner from "./library";
import PluginMessagePartner from "./plugin_message_partner";
import { Json } from "./../../../utils/json";
import { send_message, send_message_acknowledge } from "../../protocols/message_partner/send_message";
import { promisify } from "../../../utils/promisify";
import { Schema } from "effect";
import { is_responsive } from "../../protocols/message_partner/is_responsive";
import { PluginEnvironment } from "../plugin_environment";
import { Transcoder } from "../../../utils/exports";

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

    get env(): PluginEnvironment {
        return this.root_message_partner.env;
    }

    get is_removed() {
        return this.removed
    }

    async is_responsive(max_timeout = 3000): Promise<boolean> {
        const res: boolean | Error = await this.run_message_partner_protocol(is_responsive, "");
        if (res instanceof Error) return false;
        return res;
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
        this._send_message_partner_message("remove");
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

    send_message(msg: Json) {
        return this._send_message_partner_message("user_message", msg);
    }

    __on_message_cb: (data: Json) => Promise<void> = () => Promise.resolve();
    on_message(cb: (data: Json) => void) {
        this.__on_message_cb = (data) => Promise.resolve(cb(data));
        this._send_message_partner_message("user_message_listener_registered");
    }
    __on_listener_registered_cb: (b: any) => Promise<void> = () => Promise.resolve();
    on_message_listener_registered(cb: (b: typeof this) => void) {
        this.__on_listener_registered_cb = (b) => Promise.resolve(cb(b));
    }

    async _trigger_on_message_partner_message(type: string, data: Json) {
        if (type === "remove") {
            await this._internal_remove();
            return true;
        }
        if (type === "user_message") {
            await this.__on_message_cb(data);
            return true;
        }
        if (type === "user_message_listener_registered") {
            await this.__on_listener_registered_cb(this);
            return true;
        }
        return false;
    }

    _send_message_partner_message(type: string, data: Json = "", acknowledge: boolean = false) {
        return this.run_message_partner_protocol(
            acknowledge ? send_message_acknowledge : send_message, {
            type,
            data
        });
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

    static find<S extends MessagePartner, T extends new (...args: any[]) => S>(type?: T):
        (ident: string) => S | null {
        return (ident: string) => {
            return (MessagePartner.message_partners.find(
                mp => (mp.own_uuid === ident) && (type ? mp instanceof type : true)
            ) as S | undefined) || null;
        }
    }

    static get findTranscoder() {
        return Transcoder.SchemaTranscoder(Schema.String)
    }
}
