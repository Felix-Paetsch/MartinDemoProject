import { ParseResult, Schema } from "effect";
import { Json } from "../utils/exports";
import { Address } from "../messaging/core/address";
import { Message } from "../messaging/core/message";
import { Middleware, Port } from "../messaging/exports";
import { cacheFun } from "./utils";

const LOGGING_PORT_ID = "logging";
const logging_port = cacheFun(() => {
    const port = new Port(LOGGING_PORT_ID);
    port.open();
    return port;
})

const MessageLogSchema = Schema.Struct({
    type: Schema.Literal("Message"),
    content: Schema.Any,
    meta_data: Schema.Record({
        key: Schema.String,
        value: Schema.Any
    })
});
export type MessageLog = Schema.Schema.Type<typeof MessageLogSchema>;

const DataLogSchema = Schema.Struct({
    type: Schema.Literal("Data"),
    data: Schema.Any
});
export type DataLog = Schema.Schema.Type<typeof DataLogSchema>;

export const LogSchema = Schema.Union(MessageLogSchema, DataLogSchema);
export type Log = Schema.Schema.Type<typeof LogSchema>;

export const MessageToLog = Schema.transformOrFail(Schema.instanceOf(Message), MessageLogSchema, {
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

export const ToLog = Schema.Union(MessageToLog, DataToLog);

const isNoLoggingMessage = function (message: Message) {
    return !message.meta_data.message_logging;
}

export const log_messages = (
    log_message: (message: Message) => void | Promise<void>,
    should_log: (message: Message) => boolean | Promise<boolean> =
        () => true
): Middleware.Middleware => {
    return async (message: Message) => {
        const b1 = isNoLoggingMessage(message);
        const b2 = await should_log(message);
        if (b1 && b2) {
            await log_message(message);
        }
        return Middleware.Continue;
    }
}

export const log = (address: Address, data: Json) => {
    const logMessage = new Message(address.forward_port(LOGGING_PORT_ID), Schema.decodeSync(ToLog)(data), {
        message_logging: {
            source_address: address.serialize()
        }
    });

    return logging_port().send(logMessage);
}

export const log_external = (url: string, data: Json) => fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
})

export function log_to_address(address: Address): (msg: Message) => Promise<void> {
    return (message: Message) => {
        const loggingContent = Schema.decodeSync(ToLog)(message);
        const logMessage = new Message(address.forward_port(LOGGING_PORT_ID), loggingContent, {
            message_logging: {
                source_address: message.target.serialize()
            }
        });

        return logging_port().send(logMessage);
    }
}

export function log_to_url(url: string) {
    return (message: Message) => {
        const loggingContent = Schema.decodeSync(ToLog)(message);
        log_external(
            url,
            loggingContent
        );
    }
}

export function recieveMessageLogs(cb: (message: Log) => void | Promise<void>) {
    logging_port().use_middleware((message: Message) => {
        if (message.meta_data.message_logging) {
            const content = message.content;
            const sanatized_content = Schema.decodeUnknownSync(LogSchema)(content);
            return cb(sanatized_content)
        }
        return Middleware.Continue;
    })
}
