import { Context, Data, Effect, Option, Schema, pipe } from "effect";
import { Json } from "../../../utils/json";
import { Address } from "../../base/address";
import { MessageTransmissionError } from "../../base/errors/message_errors";
import { Message } from "../../base/message";
import { SendEffect, SendEffectT } from "../../base/send";
import { ChainMessageResult, ChainTimeout } from "../../message_chains";
import { ProtocolError, ProtocolErrorN, ProtocolErrorR } from "./protocol_errors";

type ProtocolMessageRespond = (data: Json, timeout?: number, is_error?: boolean) =>
    Effect.Effect<
        Effect.Effect<ProtocolMessage, ProtocolError>,
        MessageTransmissionError | ProtocolError,
        never
    >

export type ProtocolMessage = Message & {
    readonly respond: ProtocolMessageRespond,
    readonly respond_error: (error: ProtocolError) => Effect.Effect<void, never, never>,
    readonly data: Json,
    has_responded: boolean,
    source: Address,
    send: SendEffect
}

export class ProtocolMessageT extends Context.Tag("ProtocolMessageT")<ProtocolMessageT, ProtocolMessage>() { }

const ProtocolMetaDataSchema = Schema.Struct({
    protocol_name: Schema.String,
    protocol_ident: Schema.Any,
    protocol_version: Schema.String,
    is_error: Schema.optionalWith(Schema.Boolean, {
        default: () => false
    })
});

export const to_protocol_message: (
    res: ChainMessageResult, protocol_meta_data: typeof ProtocolMetaDataSchema.Type
) => Effect.Effect<ProtocolMessage, ProtocolError, SendEffectT>
    = Effect.fn("to_protocol_message")(
        function* (
            res: ChainMessageResult,
            protocol_meta_data: typeof ProtocolMetaDataSchema.Type
        ) {
            const msg = res.message;
            const send = yield* SendEffectT;

            const respond: ProtocolMessageRespond = Effect.fn("protocol_message_respond")(
                function* (data = "Ok", timeout?: number, is_error: boolean = false) {
                    if (unsanatizedProtocolMessage.has_responded) {
                        return yield* ProtocolErrorN({
                            message: "Message already responded",
                            Message: unsanatizedProtocolMessage
                        });
                    }

                    unsanatizedProtocolMessage.has_responded = true;
                    const res_e = yield* res.respond({ data }, {
                        protocol: {
                            ...protocol_meta_data, is_error
                        }
                    }, timeout, send).pipe(
                        Effect.catchTag(
                            "InvalidMessageFormatError",
                            Effect.fnUntraced(function* (e) {
                                return yield* ProtocolErrorN({
                                    message: "Invalid message format",
                                    error: e
                                })
                            })
                        )
                    )

                    return res_e.pipe(
                        Effect.andThen(message => to_protocol_message(message, protocol_meta_data)),
                        Effect.catchAll((e) => Effect.gen(
                            function* () {
                                if (e instanceof ProtocolError) return yield* e
                                if (e instanceof ChainTimeout) {
                                    return yield* ProtocolErrorN({
                                        message: "Protocol timeout",
                                        error: e
                                    })
                                }
                                return yield* ProtocolErrorN({
                                    error: e as Error
                                })
                            })
                        ),
                        Effect.provideService(SendEffectT, send)
                    )
                }
            )

            const respond_error: ProtocolMessage["respond_error"] = (err) =>
                pipe(
                    respond(err.serialize() as unknown as Json, 0, true),
                    Effect.tapError(e => Effect.logError(e)),
                    Effect.ignore
                );

            const unsanatizedProtocolMessage: ProtocolMessage = Object.assign(msg, {
                respond,
                respond_error,
                data: {},
                has_responded: false,
                send: send,
                source: res.source
            });

            const content = yield* msg.content.pipe(
                Effect.catchAll(e => ProtocolErrorR({
                    message: "Invalid message content",
                    Message: unsanatizedProtocolMessage
                }))
            );

            if (!content.hasOwnProperty('data')) {
                return yield* ProtocolErrorR({
                    message: "Message content missing 'data' attribute",
                    Message: unsanatizedProtocolMessage
                });
            }

            const protocol_meta_data_result = yield* get_protocol_meta_data(msg.meta_data);
            if (Option.isNone(protocol_meta_data_result)) {
                return yield* ProtocolErrorR({
                    message: "Invalid protocol meta data",
                    Message: unsanatizedProtocolMessage
                });
            }

            (unsanatizedProtocolMessage as any).data = content.data;
            yield* ProtocolError.throwIfRespondedWithError(unsanatizedProtocolMessage);

            return unsanatizedProtocolMessage;
        });

export const get_protocol_meta_data = (meta_data: { [key: string]: Json }) =>
    Schema.decodeUnknown(ProtocolMetaDataSchema)(meta_data.protocol).pipe(
        Effect.andThen(data => Data.struct(data)),
        Effect.option
    ) 