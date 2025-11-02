import { Schema } from "effect";

export const MessageChannelInitializationContextSchema = Schema.Struct({
    target_processor: Schema.String,
    data: Schema.optionalWith(Schema.Any, { exact: true }),
    id: Schema.optionalWith(Schema.String, { exact: true }),
    remotely_initialized: Schema.optionalWith(Schema.Boolean, {
        exact: true,
        default: () => false
    })
});

export const MessageChannelInitializationContextWithIdSchema = Schema.Struct({
    ...MessageChannelInitializationContextSchema.fields,
    id: Schema.String
});

export type MessageChannelInitializationContextWithId = typeof MessageChannelInitializationContextWithIdSchema.Type;
export type MessageChannelInitializationContextWithIdEncoded = typeof MessageChannelInitializationContextWithIdSchema.Encoded;
export type MessageChannelInitializationContext = typeof MessageChannelInitializationContextSchema.Type;
export type MessageChannelInitializationContextEncoded = typeof MessageChannelInitializationContextSchema.Encoded;