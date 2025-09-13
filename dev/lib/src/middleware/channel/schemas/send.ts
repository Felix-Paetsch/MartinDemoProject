import { Schema } from "effect";

export const SendMessageBodySchema = Schema.Struct({
    type: Schema.Literal("SendMessage"),
    data: Schema.Any,
    targetID: Schema.String
});

export type SendMessageBody = Schema.Schema.Type<typeof SendMessageBodySchema>;
export type SendMessageBodyEncoded = Schema.Schema.Encoded<typeof SendMessageBodySchema>;