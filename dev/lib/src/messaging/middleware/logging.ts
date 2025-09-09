import { Effect, ParseResult, Schema } from "effect";
import { Json } from "../../utils/exports";
import { Address } from "../base/address";
import { Message } from "../base/message";
import { Middleware, MiddlewareContinue } from "../base/middleware";
import { send } from "../base/send";
import { IgnoreHandled } from "../base/errors/errors";

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
    decode: (message, _, ast) => message.content.pipe(
        Effect.andThen(content => {
            return ParseResult.succeed({
                type: "Message" as const,
                content: content,
                meta_data: message.meta_data
            })
        }),
        Effect.catchAll(() => ParseResult.fail(
            new ParseResult.Type(ast, message, "Couldn't decode content")
        ))
    ),
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

const isNoLoggingMessage = Effect.fn("isNoLoggingMessage")(
    function* (message: Message) {
        return !message.meta_data.message_logging;
    }
)

export const log_messages = (
    log_message: (message: Message) => void | Promise<void>,
    should_log: (message: Message) => boolean | Promise<boolean> =
        () => true
): Middleware => {
    return async (message: Message) => {
        const b1 = await isNoLoggingMessage(message);
        const b2 = await should_log(message);
        if (b1 && b2) {
            await log_message(message);
        }
        return MiddlewareContinue;
    }
}

export const log = (address: Address, data: Json) => {
    const logMessage = new Message(address, Schema.decodeSync(ToLog)(data), {
        message_logging: {
            source_address: address.serialize()
        }
    });

    return send(logMessage).pipe(
        IgnoreHandled,
        Effect.runPromise
    );
}

export const log_external = (url: string, data: Json) => fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
})

export function log_to_address(address: Address): Middleware {
    return (message: Message) => {
        const loggingContent = Schema.decodeSync(ToLog)(message);
        const logMessage = new Message(address, loggingContent, {
            message_logging: {
                source_address: message.target.serialize()
            }
        });

        return send(logMessage).pipe(
            IgnoreHandled,
            Effect.runPromise
        );
    }
}

export function log_to_url(url: string) {
    return (message: Message) => {
        const loggingContent = Schema.decodeSync(ToLog)(message);
        return log_external(
            url,
            loggingContent
        );
    }
}

export function recieveMessageLogs(cb: (message: Log) => void | Promise<void>): Middleware {
    return (message: Message) => {
        if (message.meta_data.message_logging) {
            const content = message.content.pipe(Effect.runSync);
            const sanatized_content = Schema.decodeUnknownSync(LogSchema)(content);
            return cb(sanatized_content)
        }
        return MiddlewareContinue;
    }
}