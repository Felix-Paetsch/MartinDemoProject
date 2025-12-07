import { Middleware } from "../../../messaging/exports";
import MessageChannel from "../../../middleware/channel";

export const defaultEnvironmentMiddleware = () => {
    const mw = Middleware.partition_middleware([
        "preprocessing",
        "monitoring",
        "listeners",
    ] as const);
    mw.listeners.push(MessageChannel.middleware);
    return mw;
};