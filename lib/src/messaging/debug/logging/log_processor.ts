import { reportAnomaly } from "../../core/errors/anomalies";
import { Address } from "../../core/address";
import { Message } from "../../core/message";
import { Middleware, MiddlewareContinue, MiddlewareInterrupt } from "../../core/middleware";
import { Log } from "./log";
import { logging_port, LOGGING_PORT_ID } from ".";

export type LogProcessor = (l: Log) => void | Promise<void>;

export const log_to_address = (address: Address = Address.local_address): LogProcessor => async (data: Log) => {
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

export function process_logs_using(cb: LogProcessor) {
    logging_port().clear_middleware();
    logging_port().use_middleware(async (message: Message) => {
        if (message.meta_data.message_logging && message.local_data.at_target) {
            const content = message.content as Log;
            // const sanatized_content = ToLog(content);
            await cb(content);
            return MiddlewareInterrupt;
        }
        return MiddlewareContinue;
    })
}

