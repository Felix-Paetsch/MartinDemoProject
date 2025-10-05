import { Effect, Schema } from "effect";
import { Json } from "./json";

export type SyncDecoder<Decoded, Encoded extends Json> = {
    decode: (data: unknown) => Error | Decoded;
}

export type SyncEncoder<Decoded, Encoded extends Json> = {
    encode: (data: Decoded) => Error | Encoded;
}

export type SyncTranscoder<Decoded, Encoded extends Json> = SyncDecoder<Decoded, Encoded> & SyncEncoder<Decoded, Encoded>;

export type Decoder<Decoded, Encoded extends Json> = {
    decode: (data: unknown) => Promise<Error | Decoded>;
}

export type Encoder<Decoded, Encoded extends Json> = {
    encode: (data: Decoded) => Promise<Error | Encoded>;
}

export type Transcoder<Decoded, Encoded extends Json> = Decoder<Decoded, Encoded> & Encoder<Decoded, Encoded>;

export const AnythingTranscoder: Transcoder<null, null> = {
    decode: async () => null,
    encode: async () => null,
}

export function identity<T extends Json>(): Transcoder<T, T> {
    return {
        decode: async (data: unknown) => data as T,
        encode: async (data: unknown) => data as T
    }
}

export function trustType<T extends Json>(_?: Transcoder<T, any>) {
    return identity<T>();
}

export function trust<T extends Transcoder<Json, any>>() {
    return identity<DecodedType<T>>();
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

export type EncodedType<T> = T extends Transcoder<infer A, infer B>
    ? B : never;

export type DecodedType<T> = T extends Transcoder<infer A, infer B>
    ? A : never;

export type SchemaTranscoderType<T> = T extends Schema.Schema<infer A, infer B>
    ? B extends Json
    ? Transcoder<A, B>
    : Transcoder<A, Json>
    : never;
