import { Address } from "../../../messaging/base/address";
import { Middleware } from "../../../messaging/base/middleware";
import { log_messages, log_to_address } from "../../../messaging/middleware/logging";

export function pluginDebugLogging(kernel_address: Address): Middleware {
    return log_messages(log_to_address(kernel_address))
}