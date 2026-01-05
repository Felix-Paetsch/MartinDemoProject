import { protocol } from "../../../middleware/protocol";
import { MessagePartner } from "../../plugin_side/message_partner/base";
import MessageChannel from "../../../middleware/channel";
import { deferred, Json } from "../../../utils/exports";

export type MessagePartnerProtocol<
    Initiator extends MessagePartner,
    Responder extends MessagePartner,
    InitiatorInitData,
    ResponderInitData extends Json,
    Result
> = (
    sender: Initiator,
    initiator_init: InitiatorInitData,
    responder_init: ResponderInitData
) => Promise<Result | Error>;
export function message_partner_protocol<
    Initiator extends MessagePartner,
    Responder extends MessagePartner,
    InitiatorInitData,
    ResponderInitData extends Json,
    Result
>(
    name: string,
    initiate: (
        mc: MessageChannel,
        initiator: Initiator,
        with_data: InitiatorInitData
    ) => Promise<Result>,
    respond: (
        mc: MessageChannel,
        responder: Responder,
        with_data: ResponderInitData
    ) => Promise<void>,
): MessagePartnerProtocol<
    Initiator,
    Responder,
    InitiatorInitData,
    ResponderInitData,
    Result
> {
    const P = protocol(
        name,
        deferred(() => MessagePartner.find()),
        initiate,
        respond,
    );

    return (
        sender: Initiator,
        initiator_init_data: InitiatorInitData,
        responder_init_data: ResponderInitData
    ) => {
        return P(
            sender,
            sender.root_message_partner.env.port,
            sender.root_message_partner.address,
            initiator_init_data,
            responder_init_data,
            sender.other_uuid
        );
    }
}
