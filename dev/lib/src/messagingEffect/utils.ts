import { ParseResult, Schema } from "effect";

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

export const swap = <A, I, R>(schema: Schema.Schema<A, I, R>): Schema.Schema<I, A, R> =>
    Schema.transformOrFail(Schema.typeSchema(schema), Schema.encodedSchema(schema), {
        decode: ParseResult.encode(schema),
        encode: ParseResult.decode(schema),
    })