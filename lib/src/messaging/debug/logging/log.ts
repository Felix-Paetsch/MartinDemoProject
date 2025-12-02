import { ParseResult, Schema } from "effect";
import { Json, Message } from "../../core/message";

const MessageLogSchema = Schema.Struct({
    type: Schema.Literal("Message"),
    content: Schema.Any,
    meta_data: Schema.Record({
        key: Schema.String,
        value: Schema.Any
    })
});
const DataLogSchema = Schema.Struct({
    type: Schema.Literal("Data"),
    data: Schema.Any
});
const LogSchema = Schema.Union(MessageLogSchema, DataLogSchema);

export type MessageLog = Schema.Schema.Type<typeof MessageLogSchema>;
export type DataLog = Schema.Schema.Type<typeof DataLogSchema>;
export type Log = Schema.Schema.Type<typeof LogSchema>;

const MessageToLog = Schema.transformOrFail(Schema.instanceOf(Message), MessageLogSchema, {
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

const DataToLog = Schema.transform(Schema.Any, DataLogSchema, {
    decode: (data) => ({
        type: "Data" as const,
        data: data,
    }),
    encode: (log) => log.data
});

export const ToLog = (log: Json | Message) => Schema.decodeSync(Schema.Union(MessageToLog, DataToLog))(log);
