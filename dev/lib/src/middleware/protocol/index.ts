import { Effect, Schema } from "effect";
import { Address, Connection, Port } from "../../messaging/exports";
import MessageChannel from "../channel";
import { registerProtocol } from "./respond";
import { Json } from "../../utils/json";

export const TransactionInitDataSchema = Schema.Struct({
    ident: Schema.Any,
    name: Schema.String,
});

export type Transcoder<Decoded, Encoded extends Json> = {
    decode: (data: unknown) => Promise<Error | Decoded>;
    encode: (data: unknown) => Promise<Error | Encoded>;
}

export const AnythingTranscoder: Transcoder<null, null> = {
    decode: async () => null,
    encode: async () => null,
}

export function SchemaTranscoder<Decoded>(schema: Schema.Schema<Decoded, any>): Transcoder<Decoded, Json> {
    return {
        decode: async (data: unknown) => Schema.decodeUnknown(schema)(data).pipe(
            Effect.merge,
            Effect.runPromise
        ),
        encode: async (data: unknown) => Schema.encodeUnknown(schema)(data).pipe(
            Effect.merge,
            Effect.runPromise
        ),
    }
}

export async function send_transcoded<R>(mc: MessageChannel, transcoder: Transcoder<R, any>, data: R) {
    const r = await transcoder.encode(data);
    if (r instanceof Error) return r;
    return await mc.send(r);
}

export async function receive_transcoded<R>(mc: MessageChannel, transcoder: Transcoder<R, any>) {
    const r = await mc.next();
    if (r instanceof Error) return r;
    return await transcoder.decode(r);
}

export async function send_await_response_transcoded<R, S>(mc: MessageChannel, transcoderIn: Transcoder<R, any>, data: R, transcoderOut: Transcoder<S, any>) {
    const r1 = await transcoderIn.encode(data);
    if (r1 instanceof Error) return r1;
    const r2 = await mc.send_await_response(r1);
    if (r2 instanceof Error) return r2;
    return await transcoderOut.decode(r2);
}

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
    responderIdent: Transcoder<IdentData, EncodedIdentData>,
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

        const res = await mc.send_await_response(
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
