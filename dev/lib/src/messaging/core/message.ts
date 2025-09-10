import { Effect, ParseResult, pipe, Schema } from "effect";
import { Address, deserializeAddressFromUnknown } from "./address";
import { MessageDeserializationError, MessageSerializationError } from "./errors/anomalies";

export type SerializedMessage = string;
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export class Message {
    public local_data: LocalMessageData;

    constructor(
        public target: Address,
        public content: { [key: string]: Json },
        public meta_data: { [key: string]: Json } = {}
    ) {
        this.local_data = {
            direction: "outgoing",
            at_target: false,
            at_source: true,
            current_address: Address.local_address
        }
    }

    serialize(): SerializedMessage {
        // Errors: MessageSerializationError
        return Schema.encode(MessageFromString)(this).pipe(
            Effect.mapError(() => new MessageSerializationError({ message: this })),
            Effect.runSync
        );
    }

    static deserialize(serialized: SerializedMessage): Message {
        // Errors: MessageDeserializationError
        return Schema.decode(MessageFromString)(serialized)
            .pipe(
                Effect.mapError(() => new MessageDeserializationError({ serialized })),
                Effect.runSync
            )
    }
}

export type TransmittableMessage = Message | SerializedMessage;

export type LocalMessageData = {
    direction: "incoming" | "outgoing" | "at_kernel";
    at_target: boolean;
    at_source: boolean;
    current_address: Address;

    [key: string]: any;
}

export const MessageFromString = Schema.transformOrFail(Schema.String, Schema.instanceOf(Message), {
    decode: (str: string, _, ast) =>
        pipe(
            Effect.try(() => JSON.parse(str)),
            Effect.catchAll(e => {
                return ParseResult.fail(
                    new ParseResult.Type(ast, str, `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`)
                );
            }),
            Effect.andThen((json) => Effect.gen(function* () {
                const content = yield* Schema.decode(Schema.Record({
                    key: Schema.String,
                    value: Schema.Any
                }))(json.content);
                const meta_data = yield* Schema.decode(Schema.Record({
                    key: Schema.String,
                    value: Schema.Any
                }))(json.meta_data);
                const target = yield* deserializeAddressFromUnknown(json.target);
                return new Message(target, content, meta_data)
            })),
            Effect.catchAll(e => {
                return ParseResult.fail(
                    new ParseResult.Type(ast, str, `Failed deserializing message: ${e instanceof Error ? e.message : String(e)}`));
            })
        ),
    encode: (msg: Message, _, ast) =>
        Effect.try(() => JSON.stringify({
            target: msg.target.serialize(),
            content: msg.content,
            meta_data: msg.meta_data
        })).pipe(
            Effect.catchAll(e => {
                return ParseResult.fail(
                    new ParseResult.Type(ast, msg, `Failed to stringify message: ${e instanceof Error ? e.message : String(e)}`)
                );
            }),
        )
});