import { Context, Effect } from "effect";
import { Address } from "./address";
import { findEndpoint } from "./endpoints";
import { LocalComputedMessageData } from "./local_computed_message_data";
import { Message } from "./message";

type MiddlewareInterrupt = { readonly __brand: "MiddlewareInterrupt" };
type MiddlewareContinue = { readonly __brand: "MiddlewareContinue" } | void | undefined;
export type MiddlewarePassthrough = MiddlewareInterrupt | MiddlewareContinue;
export const MiddlewareInterrupt: MiddlewareInterrupt = { __brand: "MiddlewareInterrupt" } as MiddlewareInterrupt;
export const MiddlewareContinue: MiddlewareContinue = { __brand: "MiddlewareContinue" } as MiddlewareContinue;

export type Middleware = (message: Message, lcmd: LocalComputedMessageData) => Effect.Effect<MiddlewarePassthrough, never>;

export type MiddlewareConf = {
    readonly middleware: Middleware;
    readonly address: Address;
}

export class MiddlewareConfT extends Context.Tag("MiddlewareConfT")<
    MiddlewareConfT,
    MiddlewareConf
>() { }

export const useMiddleware = Effect.fn("useMiddleware")(
    function* (mwConf: MiddlewareConf) {
        const {
            middleware,
            address
        } = mwConf;

        const endpoint = yield* findEndpoint(address);
        endpoint.middlewares.push(middleware);
    }
);