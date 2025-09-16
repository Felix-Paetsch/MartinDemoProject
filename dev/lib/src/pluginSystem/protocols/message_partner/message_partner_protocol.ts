import { Schema } from "effect";
import { Protocol, protocol, SchemaTranscoder } from "../../../middleware/protocol";
import { MessagePartner } from "../../plugin_lib/message_partner/base";
import { findMessagePartner } from "../findResponder";
import MessageChannel from "../../../middleware/channel";
import PluginMessagePartner from "../../plugin_lib/message_partner/plugin_message_partner";
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
        let address: Address;
        if (sender.root_message_partner instanceof PluginMessagePartner) {
            address = sender.root_message_partner.plugin_descriptor.address;
        } else {
            address = sender.root_message_partner.library_descriptor.address;
        }
        return P(
            sender,
            sender.root_message_partner.env.port,
            address,
            with_data,
            sender.other_uuid
        );
    }
}