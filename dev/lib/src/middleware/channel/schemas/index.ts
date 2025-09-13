import { Schema } from "effect";
import { OpenChannelBodySchema } from "./open";
import { SendMessageBodySchema } from "./send";
import { CloseMessageBodySchema } from "./close";

export const MessageDataSchema = Schema.Union(SendMessageBodySchema, OpenChannelBodySchema, CloseMessageBodySchema);
export type MessageData = Schema.Schema.Type<typeof MessageDataSchema>;
export type MessageDataEncoded = Schema.Schema.Encoded<typeof MessageDataSchema>;