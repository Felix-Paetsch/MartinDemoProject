import { Schema } from "effect";

export const CloseMessageBodySchema = Schema.Struct({
    type: Schema.Literal("CloseChannel"),
    targetID: Schema.String
});

export type CloseMessageBody = Schema.Schema.Type<typeof CloseMessageBodySchema>;
export type CloseMessageBodyEncoded = Schema.Schema.Encoded<typeof CloseMessageBodySchema>;