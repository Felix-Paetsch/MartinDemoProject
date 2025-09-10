import { Middleware } from "../core/middleware";
import { Message } from "../core/message";
import { MiddlewareInterrupt } from "../core/middleware";

export const comsume_message = (fn: (msg: Message) => void | Promise<void>): Middleware => {
    return async (message: Message) => {
        await fn(message);
        return MiddlewareInterrupt;
    }
}

