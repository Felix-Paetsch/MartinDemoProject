import { Schema } from "effect";
import { reportAnomaly } from "../../core/errors/anomalies";
import { cacheFun, Json } from "../../../utils/exports";
import { Address } from "../../core/address";
import { Message } from "../../core/message";
import Port from "../../core/port";
import { Middleware, MiddlewareContinue, MiddlewareInterrupt } from "../../core/middleware";
import { Log, LogSchema } from "./log";
import { ToLog } from "./log";
import { collection_middleware } from "../../middleware/collection";
import { annotation_middleware } from "../../middleware/annotation";

const LOGGING_PORT_ID = "_logging";
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

async function log_json(data: Log): Promise<void> {
    if (!logging_target) return Promise.resolve();
    if (logging_target instanceof Address) {
        return log_to_address(logging_target)(data);
    }

    return log_to_url(logging_target)(data);
}

export const log_to_address = (address: Address): LogProcessor => async (data: Log) => {
    const logMessage = new Message(
        address.forward_port(LOGGING_PORT_ID),
        data,
        {
            message_logging: {
                source_address: address.serialize()
            }
        }
    );

    const p = logging_port();
    if (p.is_open()) {
        p.send(logMessage);
    } else {
        reportAnomaly(new Error("Logging port is closed."));
    }
    return;
}

export const log_to_url = (url: string): LogProcessor => async (data: Log) => {
    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch(() => {
        reportAnomaly(new Error("Failed to post data to server."))
    });
}

export function log(data: Json, to: string | Address | null = null) {
    const log = Schema.decodeSync(ToLog)(data);
    if (to) {
        if (to instanceof Address) {
            return log_to_address(to)(log);
        } else {
            return log_to_url(to)(log);
        }
    }
    return log_json(log)
}

const shouldLogMessage = function (message: Message) {
    return !message.meta_data.message_logging;
}

export function log_middleware(lp: LogProcessor = log_json): Middleware {
    return collection_middleware(
        annotation_middleware(),
        async (message: Message) => {
            if (shouldLogMessage(message)) {
                await lp(Schema.decodeSync(ToLog)(message));
            }
            return MiddlewareContinue;
        }
    )()
}

export type LogProcessor = (log: Log) => void | Promise<void>;
export function process_middleware_logs_using(cb: LogProcessor) {
    logging_port().clear_middleware();
    logging_port().use_middleware(async (message: Message) => {
        if (message.meta_data.message_logging && message.local_data.at_target) {
            const content = message.content;
            const sanatized_content = Schema.decodeUnknownSync(LogSchema)(content);
            await cb(sanatized_content);
            return MiddlewareInterrupt;
        }
        return MiddlewareContinue;
    })
}

