import { Address } from "../../../../messaging/core/address";
import { Middleware } from "../../../../messaging/core/middleware";
import { log_messages, log_to_address } from "../../../../advanced_messaging/logging";

export function pluginDebugLogging(kernel_address: Address): Middleware {
    return log_messages(log_to_address(kernel_address))
}