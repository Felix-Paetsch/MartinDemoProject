import { Address, Middleware } from "../../../messaging/exports";
import { log_messages, log_to_address } from "../../../middleware/logging";

export function pluginDebugLogging(kernel_address: Address): Middleware.Middleware {
    return log_messages(log_to_address(kernel_address))
}
