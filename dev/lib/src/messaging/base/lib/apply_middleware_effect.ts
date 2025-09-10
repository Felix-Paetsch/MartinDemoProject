import { Effect } from "effect";
import { Message } from "../message";
import { isMiddlewareInterrupt, Middleware, MiddlewareContinue, MiddlewareInterrupt } from "../middleware";
import { callbackToEffect } from "../errors/main";

export const applyMiddlewareEffect =
    Effect.fn("applyMiddlewareEffect")(function* (msg: Message, middlewares: Middleware[]) {
        for (const middleware of middlewares) {
            const interrupt = yield* callbackToEffect(middleware, msg);
            if (isMiddlewareInterrupt(interrupt)) {
                return MiddlewareInterrupt;
            }
        }

        return MiddlewareContinue;
    }); 