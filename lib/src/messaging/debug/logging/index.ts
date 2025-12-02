import { cacheFun, Json } from "../../../utils/exports";
import { Address } from "../../core/address";
import { Message } from "../../core/message";
import Port from "../../core/port";
import { Log, ToLog } from "./log";
import { collection_middleware } from "../../middleware/collection";
import { annotation_middleware } from "../../middleware/annotation";
import { log_to_address, log_to_url, LogProcessor } from "./log_processor";
import { Middleware, MiddlewareContinue } from "../../core/middleware";

export const LOGGING_PORT_ID = "_logging";
export const logging_port = cacheFun(() => {
    const port = new Port(LOGGING_PORT_ID);
    port.open();
    return port;
})

export type URL_string = string;
let logging_target: URL_string | Address | null = null;
export function set_logging_target(target: null | URL_string | Address) {
    logging_target = target;
}

async function log_to_target(data: Log): Promise<void> {
    if (!logging_target) return log_to_address(Address.local_address)(data);
    if (logging_target instanceof Address) {
        return log_to_address(logging_target)(data);
    }

    return log_to_url(logging_target)(data);
}

export function log(data: Json, to: string | Address | null = null) {
    const log = ToLog(data);
    if (to) {
        if (to instanceof Address) {
            return log_to_address(to)(log);
        } else {
            return log_to_url(to)(log);
        }
    }
    return log_to_target(log)
}

const shouldLogMessage = function (message: Message) {
    return !message.meta_data.message_logging;
}

export function log_middleware(lp: LogProcessor = log_to_target): Middleware {
    return collection_middleware(
        annotation_middleware(),
        async (message: Message) => {
            if (shouldLogMessage(message)) {
                await lp(ToLog(message));
            }
            return MiddlewareContinue;
        }
    )()
}
