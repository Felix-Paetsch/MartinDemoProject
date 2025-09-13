import { Effect, ParseResult, Schema } from "effect";
import { Address } from "../messaging/exports";

export const cacheFun = <T>(fn: () => T) => {
    let called = false;
    let value: T | undefined;
    return () => {
        if (!called) {
            value = fn();
        }
        called = true;
        return value as T;
    }
}

export const SerializedAddressSchema = Schema.Struct({
    process_id: Schema.String,
    port: Schema.String
});

export const DeserializeAddress = (a: unknown) => Effect.try(() => Address.deserialize(a as any));
export const AddressFromString = Schema.transformOrFail(SerializedAddressSchema, Schema.instanceOf(Address), {
    decode: (s, _, ast) => DeserializeAddress(s).pipe(
        Effect.mapError(e => new ParseResult.Type(ast, s, e.message))
    ),
    encode: (a, _, ast) => ParseResult.succeed(a.serialize())
});


export const swap = <A, I, R>(schema: Schema.Schema<A, I, R>): Schema.Schema<I, A, R> =>
    Schema.transformOrFail(Schema.typeSchema(schema), Schema.encodedSchema(schema), {
        decode: ParseResult.encode(schema),
        encode: ParseResult.decode(schema),
    })