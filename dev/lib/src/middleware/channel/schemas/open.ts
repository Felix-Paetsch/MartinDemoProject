import { Schema } from "effect";
import { MessageChannelInitializationContextWithIdSchema } from "./context";
import { MessageChannelConfigSchema } from "./config";
import { AddressFromString } from "../../../messagingEffect/schemas";
import { SendMessageBodySchema } from "./send";

export const OpenChannelBodySchema = Schema.Struct({
    type: Schema.Literal("OpenNewChannel"),
    context: Schema.Struct({
        ...MessageChannelInitializationContextWithIdSchema.fields,
        remotely_initialized: Schema.Literal(true)
    }),
    config: MessageChannelConfigSchema,
    address: AddressFromString,
    message: Schema.optionalWith(SendMessageBodySchema, { exact: true })
});

export type OpenChannelBody = Schema.Schema.Type<typeof OpenChannelBodySchema>;
export type OpenChannelBodyEncoded = Schema.Schema.Encoded<typeof OpenChannelBodySchema>;