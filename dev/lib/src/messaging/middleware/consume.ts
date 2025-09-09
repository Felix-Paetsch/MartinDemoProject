import { Middleware } from "../base/middleware";
import { Message } from "../base/message";
import { MiddlewareInterrupt } from "../base/middleware";

export const comsume_message = (fn: (msg: Message) => void | Promise<void>): Middleware => {
    return async (message: Message) => {
        await fn(message);
        return MiddlewareInterrupt;
    }
}

