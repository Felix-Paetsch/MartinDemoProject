import { Effect, Schema } from "effect";
import { Address, Connection, Port } from "../../messaging/exports";
import MessageChannel from "../channel";
import { registerProtocol } from "./respond";
import { Json } from "../../utils/json";
import { Transcoder } from "../../utils/exports";

export const TransactionInitDataSchema = Schema.Struct({
    ident: Schema.Any,
    name: Schema.String,
});

export type Protocol<Initiator, Responder, InitData, IdentData, Result> = (sender: Initiator, port: Port, target: Address, with_data: InitData, ident_data: IdentData) => Promise<Result | Error>;
export function protocol<
    Initiator,
    Responder,
    IdentData,
    EncodedIdentData extends Json,
    InitData,
    Result
>(
    protocol_name: string,
    responderIdent: Transcoder.Transcoder<IdentData, EncodedIdentData>,
    findResponder: (identData: IdentData, mc: MessageChannel) => null | Responder,
    initiate: (mc: MessageChannel, initiator: Initiator, with_data: InitData) => Promise<Result>,
    respond: (mc: MessageChannel, responder: Responder) => Promise<void>,
): Protocol<Initiator, Responder, InitData, IdentData, Result> {
    registerProtocol(protocol_name, {
        findResponder,
        responderIdent,
        respond,
    });

    return async (sender: Initiator, port: Port, target: Address, with_data: InitData, ident_data: IdentData) => {
        // console.log("Executing protocol", protocol_name);
        const mc = new MessageChannel(
            target,
            port,
            { target_processor: "protocol_processor" },
            { defaultMessageTimeout: 2000 }
        );

        if (!mc.is_open()) {
            return new Error("Port is closed");
        }

        const data = await responderIdent.encode(ident_data);
        if (data instanceof Error) return data;

        const res = await mc.send_await_next(
            Schema.encodeSync(TransactionInitDataSchema)({
                ident: data,
                name: protocol_name,
            }));

        if (res !== "ok") return new Error("Failed to find responder");
        return await initiate(mc, sender, with_data).then(r => {
            // console.log("End Executing", protocol.name)
            return r;
        });
    }
}

export const NoResponder = "NoResponder" as const;
export type NoResponderProtocol<Initiator, InitData, Result> = (
    sender: Initiator, port: Port, target: Address, with_data: InitData
) => Promise<Result | Error>;

export function noResponderProtocol<
    Initiator,
    InitData,
    Result
>(
    protocol_name: string,
    initiate: (mc: MessageChannel, initiator: Initiator, with_data: InitData) => Promise<Result>,
    respond: (mc: MessageChannel) => Promise<void>,
): NoResponderProtocol<Initiator, InitData, Result> {
    const p = protocol(
        protocol_name,
        Transcoder.AnythingTranscoder,
        () => NoResponder,
        initiate,
        respond
    )
    return (sender: Initiator, port: Port, target: Address, with_data: InitData) =>
        p(sender, port, target, with_data, null)
}
