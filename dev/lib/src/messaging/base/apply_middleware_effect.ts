import { Effect } from "effect";
import { Address } from "./address";
import { findEndpointOrFail } from "./endpoints";
import { LocalComputedMessageData } from "./local_computed_message_data";
import { Message } from "./message";
import { MiddlewareInterrupt, MiddlewarePassthrough } from "./middleware";

export const applyMiddlewareEffect =
    Effect.fn("applyMiddlewareEffect")(function* (msg: Message, of_address: Address, lcmd: LocalComputedMessageData) {
        const endpoint = yield* findEndpointOrFail(of_address);

        for (const middleware of endpoint.middlewares) {
            const interrupt = yield* middleware(msg, lcmd);
            if (interrupt == MiddlewareInterrupt) {
                return interrupt as MiddlewarePassthrough;
            }
        }

        return yield* Effect.void;
    }); 