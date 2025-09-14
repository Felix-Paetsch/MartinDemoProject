import { Effect, ParseResult, pipe, Schema } from "effect";
import { Address } from "../messaging/core/address";
import { AddressDeserializationError } from "../messaging/core/errors/anomalies";
import { Message } from "../messaging/core/message";


export const SerializedAddressSchema = Schema.Struct({
    process_id: Schema.String,
    port: Schema.String
})

export const AddressFromString = Schema.transformOrFail(
    SerializedAddressSchema,
    Schema.suspend(() => Schema.instanceOf(Address)),
    {
        decode: (s, _, ast) => deserializeAddressFromUnknown(s).pipe(
            Effect.mapError(e => new ParseResult.Type(ast, s, e.message))
        ),
        encode: (a, _, ast) => ParseResult.succeed(a.serialize())
    });

export function deserializeAddressFromUnknown(serialized: unknown): Effect.Effect<Address, AddressDeserializationError> {
    return Effect.gen(function* () {
        const json = yield* Schema.decodeUnknown(SerializedAddressSchema)(serialized);
        return new Address(json.process_id, json.port);
    }).pipe(
        Effect.mapError(() => new AddressDeserializationError({ address: serialized }))
    )
}

/*******************************************/

export const MessageFromString = Schema.transformOrFail(
    Schema.String,
    Schema.suspend(() => Schema.instanceOf(Message)),
    {
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