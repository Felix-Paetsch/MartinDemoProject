import { Effect, ParseResult, Schema } from "effect";
import { Address, AddressDeserializationError } from "../core/address";

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
