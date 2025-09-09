import { Effect } from "effect";
import { Address } from "./address";
import { findEndpointOrFail } from "./endpoints";
import { Message } from "./message";
import { isMiddlewareInterrupt, MiddlewareContinue, MiddlewareInterrupt } from "./middleware";
import { callbackToEffect } from "./errors/main";

export const applyMiddlewareEffect =
    Effect.fn("applyMiddlewareEffect")(function* (msg: Message, of_address: Address) {
        const endpoint = yield* findEndpointOrFail(of_address);

        for (const middleware of endpoint.middlewares) {
            const interrupt = yield* callbackToEffect(middleware, msg);
            if (isMiddlewareInterrupt(interrupt)) {
                return MiddlewareInterrupt;
            }
        }

        return MiddlewareContinue;
    }); 