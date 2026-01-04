import { ParseResult, Schema } from "effect";
import { Json } from "../../utils/exports";
import { Message } from "../core/message";

export const MessageLogSchema = Schema.Struct({
    type: Schema.Literal("Message"),
    content: Schema.Any,
    meta_data: Schema.Record({
        key: Schema.String,
        value: Schema.Any
    })
});
export const DataLogSchema = Schema.Struct({
    type: Schema.Literal("Data"),
    data: Schema.Any
});
export const LogSchema = Schema.Union(MessageLogSchema, DataLogSchema);

export const MessageToLog = Schema.transformOrFail(Schema.Struct({
    __tag: Schema.Literal("message"),
    content: Schema.Any,
    meta_data: Schema.Any
}), MessageLogSchema, {
    decode: (message, _, ast) => ParseResult.succeed({
        type: "Message" as const,
        content: message.content,
        meta_data: message.meta_data
    }),
    encode: (log, _, ast) => ParseResult.fail(new ParseResult.Forbidden(
        ast,
        log.content,
        "Encoding MessageLog back to Message is forbidden."
    ))
});

export const DataToLog = Schema.transform(Schema.Any, DataLogSchema, {
    decode: (data) => ({
        type: "Data" as const,
        data: data,
    }),
    encode: (log) => log.data
});
