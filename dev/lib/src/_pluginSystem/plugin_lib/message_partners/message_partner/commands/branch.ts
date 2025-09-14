import { Effect } from "effect";
import { ProtocolError } from "../../../../../messaging/protocols/base/protocol_errors";
import { Json } from "../../../../../utils/json";
import { MPOCommunicationHandler } from "../../base/mpo_commands/mpo_communication/MPOCommunicationHandler";
import { createMpo, receiveMpo } from "../create_mpo";
import { MessagePartner } from "../message_partner";

const cmd = "create_message_partner";

export function branch_impl(this: MessagePartner, data: Json = null): Effect.Effect<MessagePartner, ProtocolError> {
    return createMpo<MessagePartner>(
        this,
        MessagePartnerFactory,
        cmd,
        data
    );
}

export function on_branch_impl(this: MessagePartner, cb: (mpo: MessagePartner, data: Json) => void): void {
    this.__branch_cb = cb;
}

export function __branch_cb_impl(this: MessagePartner, mpo: MessagePartner, data: Json): void {
    mpo.remove();
}

export function register_branch_command(MPC: typeof MessagePartner) {
    MPC.add_command({
        command: cmd,
        on_first_request: (mp: MessagePartner, im: MPOCommunicationHandler, data: Json) => {
            return receiveMpo<MessagePartner>(mp, im, MessagePartnerFactory, (mpo) => {
                mp.__branch_cb(mpo, data);
            }).pipe(Effect.withSpan(cmd));
        }
    });
}

const MessagePartnerFactory = class {
    constructor(mpo: MessagePartner, uuid: string) {
        return new MessagePartner(mpo.address, mpo.env, uuid);
    }
} as { new(mpo: MessagePartner, uuid: string): MessagePartner }