import { Schema } from "effect";
import { Address, Port } from "../../messaging/exports";
import MessageChannel from "../channel";
import { registerProtocol } from "./respond";
import { Json } from "../../utils/json";
import { localizeErrorAsync } from "../../utils/exports";

export const TransactionInitDataSchema = Schema.Struct({
    ident: Schema.Any,
    name: Schema.String,
    initData: Schema.parseJson()
});

export type Protocol<
    // The two objects communicationg
    Initiator,
    Responder,

    // Their respective start data
    InitiatorInitData,
    ResponderInitData extends Json,

    // The data needed to identify responder
    IdentData extends Json,

    // The result at the initiater side
    Result
> = (
    // Own side thing communicating
    sender: Initiator,
    // The port to send the message through (applying port specific middleware)
    // Default is fine
    port: Port,
    // Where to send to
    target: Address,
    // Init data
    initiatorData: InitiatorInitData,
    responderData: ResponderInitData,
    // Data to find the object
    ident_data: IdentData
) => Promise<Result | Error>;

export function protocol<
    Initiator,
    Responder,

    InitiatorInitData,
    ResponderInitData extends Json,

    IdentData extends Json,

    Result
>(
    protocol_name: string,
    findResponder: (identData: IdentData, mc: MessageChannel) => null | Responder,
    initiate: (mc: MessageChannel, initiator: Initiator, with_data: InitiatorInitData) => Promise<Result>,
    respond: (mc: MessageChannel, responder: Responder, with_data: ResponderInitData) => Promise<void>,
): Protocol<
    Initiator,
    Responder,
    InitiatorInitData,
    ResponderInitData,
    IdentData,
    Result
> {
    registerProtocol(protocol_name, {
        findResponder,
        respond,
    });

    return async (
        sender: Initiator,
        port: Port,
        target: Address,
        initiatorData: InitiatorInitData,
        responderData: ResponderInitData,
        ident_data: IdentData
    ) => {
        const mc = new MessageChannel(
            target,
            port,
            [
                Schema.encodeSync(TransactionInitDataSchema)({
                    ident: ident_data,
                    name: protocol_name,
                    initData: responderData
                })
            ],
            { target_processor: "protocol_processor" },
            { defaultMessageTimeout: 2000 }
        );

        if (!mc.is_open()) {
            return new Error("Port is closed");
        }

        return await localizeErrorAsync(
            initiate(mc, sender, initiatorData)
        );
    }
}

export const NoResponder = "NoResponder" as const;
export type NoResponderProtocol<
    Initiator,
    InitiatorInitData,
    ResponderInitData extends Json,
    Result
> = (
    sender: Initiator,
    port: Port,
    target: Address,
    initiatorData: InitiatorInitData,
    responderData: ResponderInitData,
) => Promise<Result | Error>;

export function noResponderProtocol<
    Initiator,
    InitiatorInitData,
    ResponderInitData extends Json,
    Result
>(
    protocol_name: string,
    initiate: (mc: MessageChannel, initiator: Initiator, with_data: InitiatorInitData) => Promise<Result>,
    respond: (mc: MessageChannel, with_data: ResponderInitData) => Promise<void>,
): NoResponderProtocol<
    Initiator,
    InitiatorInitData,
    ResponderInitData,
    Result
> {
    const p = protocol(
        protocol_name,
        () => NoResponder,
        initiate,
        (mc: MessageChannel, responder: any, with_data: ResponderInitData) => respond(mc, with_data)
    )

    return (
        sender: Initiator,
        port: Port,
        target: Address,
        initiatorData: InitiatorInitData,
        responderData: ResponderInitData,
    ) =>
        p(sender, port, target, initiatorData, responderData, null)
}
