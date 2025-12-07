import { protocol } from "../../../middleware/protocol";
import { MessagePartner } from "../../plugin_side/message_partner/base";
import MessageChannel from "../../../middleware/channel";
import { deferred } from "../../../utils/defer";

export type MessagePartnerProtocol<Initiator extends MessagePartner, Responder extends MessagePartner, InitData, Result> = (sender: Initiator, with_data: InitData) => Promise<Result | Error>;
export function message_partner_protocol<
    Initiator extends MessagePartner,
    Responder extends MessagePartner,
    InitData,
    Result
>(
    name: string,
    initiate: (mc: MessageChannel, initiator: Initiator, with_data: InitData) => Promise<Result>,
    respond: (mc: MessageChannel, responder: Responder) => Promise<void>,
): MessagePartnerProtocol<Initiator, Responder, InitData, Result> {
    const P = protocol(
        name,
        deferred(() => MessagePartner.findTranscoder),
        deferred(() => MessagePartner.find()),
        initiate,
        respond,
    );

    return (sender: Initiator, with_data: InitData) => {
        return P(
            sender,
            sender.root_message_partner.env.port,
            sender.root_message_partner.address,
            with_data,
            sender.other_uuid
        );
    }
}
