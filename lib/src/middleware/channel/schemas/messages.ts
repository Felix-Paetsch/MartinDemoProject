import { Schema } from "effect";
import { MessageChannelInitializationContextWithIdSchema } from "./context";
import { MessageChannelConfigSchema } from "./config";
import { AddressFromString } from "../../../shared_effect/schemas";

export const OpenChannelBodySchema = Schema.Struct({
    type: Schema.Literal("OpenNewChannel"),
    context: Schema.Struct({
        ...MessageChannelInitializationContextWithIdSchema.fields,
        remotely_initialized: Schema.Literal(true)
    }),
    config: MessageChannelConfigSchema,
    address: AddressFromString
});

export const SendMessageBodySchema = Schema.Struct({
    type: Schema.Literal("SendMessage"),
    data: Schema.Any,
    targetID: Schema.String
});

export const CloseMessageBodySchema = Schema.Struct({
    type: Schema.Literal("CloseChannel"),
    targetID: Schema.String
});

export const ChannelMessageSchema = Schema.Union(
    SendMessageBodySchema,
    OpenChannelBodySchema,
    CloseMessageBodySchema
);

export type InternalChannelMessage = Schema.Schema.Type<typeof ChannelMessageSchema>

export const ChannelTransmitionData = Schema.mutable(Schema.Struct({
    messages: Schema.mutable(Schema.Array(ChannelMessageSchema))
}))

