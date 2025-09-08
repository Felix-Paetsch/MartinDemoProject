import { Effect, ParseResult, Schema } from "effect";
import { Json } from "../../utils/exports";
import { Address } from "../base/address";
import { LocalComputedMessageData } from "../base/local_computed_message_data";
import { Message } from "../base/message";
import { Middleware, MiddlewareContinue } from "../base/middleware";
import { send } from "../base/send";

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
    function* (message: Message, lcmd: LocalComputedMessageData) {
        return !message.meta_data.message_logging;
    }
)

export const log_messages = (
    log_message: (message: Message, lcmd: LocalComputedMessageData) => Effect.Effect<void, never>,
    should_log: (message: Message, lcmd: LocalComputedMessageData) => Effect.Effect<boolean, never> =
        () => Effect.succeed(true)
): Middleware => Effect.fn("log_messages")(
    function* (
        message: Message,
        lcmd: LocalComputedMessageData
    ) {
        const b1 = yield* isNoLoggingMessage(message, lcmd);
        const b2 = yield* should_log(message, lcmd);
        if (b1 && b2) {
            yield* log_message(message, lcmd);
        }
        return MiddlewareContinue;
    }
)

export const log = Effect.fn("log")(
    function* (address: Address, data: Json) {
        const logMessage = new Message(address, yield* Schema.decode(ToLog)(data), {
            message_logging: {
                source_address: address.serialize()
            }
        });

        yield* send(logMessage).pipe(
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore
        );
    });

export const log_external = Effect.fn("log_external")(
    function* (url: string, data: Json) {
        yield* Effect.tryPromise({
            try: () => fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            }),
            catch: (error) => new Error(`Failed to log to external URL: ${error}`)
        });
    });

export function log_to_address(address: Address): Middleware {
    return Effect.fn("log_to_address")(
        function* (message: Message, lcmd: LocalComputedMessageData) {
            const loggingContent = yield* Schema.decode(ToLog)(message);
            const logMessage = new Message(address, loggingContent, {
                message_logging: {
                    source_address: message.target.serialize()
                }
            });

            yield* send(logMessage);
        }, (e) => e.pipe(
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore
        ))
}

export function log_to_url(url: string) {
    return Effect.fn("log_to_url")(
        function* (message: Message) {
            const loggingContent = yield* Schema.decode(ToLog)(message);
            yield* log_external(
                url,
                loggingContent
            )
        }, (e) => e.pipe(
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore
        ))
}

export function recieveMessageLogs(cb: (message: Log) => Effect.Effect<void, never>): Middleware {
    return (message: Message) => Effect.gen(function* () {
        if (message.meta_data.message_logging) {
            const content = yield* message.content;
            const sanatized_content = yield* Schema.decodeUnknown(LogSchema)(content);
            yield* cb(sanatized_content);
        }
        return MiddlewareContinue;
    }).pipe(
        Effect.withSpan("recieveMessageLogs"),
        Effect.tapError(e => Effect.logError(e)),
        Effect.ignore
    )
}