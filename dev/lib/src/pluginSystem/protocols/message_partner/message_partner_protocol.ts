import { Schema } from "effect";
import { Protocol, protocol, SchemaTranscoder } from "../../../middleware/protocol";
import { type MessagePartner } from "../../plugin_lib/message_partner/base";
import { findMessagePartner } from "../findResponder";
import MessageChannel from "../../../middleware/channel";
import { Address } from "../../../messaging/exports";

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
        SchemaTranscoder(Schema.String),
        findMessagePartner(),
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
