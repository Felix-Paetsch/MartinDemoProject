import { Schema } from "effect";
import { reportAnomaly } from "../../core/errors/anomalies";
import { Json } from "../../../utils/exports";
import { Address } from "../../core/address";
import { Message } from "../../core/message";
import Port from "../../core/port";
import { Middleware, MiddlewareContinue, MiddlewareInterrupt } from "../../core/middleware";
import { cacheFun } from "../../../messagingEffect/utils";
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
    return log_json(Schema.decodeSync(ToLog)(data))
}

const shouldLogMessage = function (message: Message) {
    return !!message.meta_data.message_logging && message.local_data.at_source;
}

export const log_middleware: Middleware = collection_middleware(
    annotation_middleware(),
    async (message: Message) => {
        if (!shouldLogMessage(message)) {
            return MiddlewareContinue;
        }
        await log_json(Schema.decodeSync(ToLog)(message));
        return MiddlewareInterrupt;
    }
)()

export type LogProcessor = (log: Log) => void | Promise<void>;
export function process_logs(cb: LogProcessor) {
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

