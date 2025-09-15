import { ParseResult, Schema } from "effect";
import { reportAnomaly } from "../../core/errors/anomalies";
import { Json } from "../../../utils/exports";
import { Address } from "../../core/address";
import { Message } from "../../core/message";
import Port from "../../core/port";
import { Middleware, MiddlewareContinue, MiddlewareInterrupt } from "../../core/middleware";
import { cacheFun } from "../../../messagingEffect/utils";

const LOGGING_PORT_ID = "logging";
const logging_port = cacheFun(() => {
    const port = new Port(LOGGING_PORT_ID);
    port.open();
    return port;
})

export type URL_string = string;
let logging_target: URL_string | Address | null = null;
export function set_logging_target(target: null | URL_string | Address) {
    logging_target = target;
}

async function log_json(data: { [key: string]: Json }): Promise<void> {
    if (!logging_target) return Promise.resolve();
    if (logging_target instanceof Address) {
        const logMessage = new Message(
            logging_target.forward_port(LOGGING_PORT_ID),
            data,
            {
                message_logging: {
                    source_address: logging_target.serialize()
                }
            }
        );

        const p = logging_port();
        if (p.is_open()) {
            await p.send(logMessage);
        } else {
            reportAnomaly(new Error("Logging port is closed."));
        }
        return;
    }

    await fetch(logging_target, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch(() => {
        reportAnomaly(new Error("Failed to post data to server."))
    });
}

export function log(data: Json) {
    return log_json(
        Schema.decodeSync(DataToLog)(data)
    )
}

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

export const log_middleware: Middleware = async (message: Message) => {
    if (isNoLoggingMessage(message)) {
        return MiddlewareContinue;
    }
    await log_json(
        Schema.decodeSync(ToLog)(message)
    );
    return MiddlewareInterrupt;
}

export function recieveMessageLogs(cb: (message: Log) => void | Promise<void>) {
    logging_port().use_middleware((message: Message) => {
        if (message.meta_data.message_logging) {
            const content = message.content;
            const sanatized_content = Schema.decodeUnknownSync(LogSchema)(content);
            return cb(sanatized_content)
        }
        return MiddlewareContinue;
    })
}

