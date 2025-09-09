import { Context, Effect, flow } from "effect";
import { Address } from "./address";
import { findEndpoint } from "./endpoints";
import { Message } from "./message";
import { CallbackError } from "./errors/errors";

type MiddlewareInterrupt = false;
type MiddlewareContinue = true | void | undefined;
export type MiddlewarePassthrough = MiddlewareInterrupt | MiddlewareContinue;
export const MiddlewareInterrupt: MiddlewareInterrupt = false;
export const MiddlewareContinue: MiddlewareContinue = true;

export function isMiddlewareInterrupt(interrupt: MiddlewarePassthrough): interrupt is MiddlewareInterrupt {
    return interrupt === false;
}

export function isMiddlewareContinue(interrupt: MiddlewarePassthrough): interrupt is MiddlewareContinue {
    return interrupt !== false;
}

export type Middleware = (message: Message) => MiddlewarePassthrough | Promise<MiddlewarePassthrough>;
export type MiddlewareEffect = (message: Message) => Effect.Effect<MiddlewarePassthrough, CallbackError>;

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

export const EffectToMiddleware = (middleware: MiddlewareEffect): Middleware => {
    return flow(middleware, (e) => {
        let err: CallbackError | undefined;
        return e.pipe(
            Effect.catchAll(e => {
                err = e;
                return Effect.succeed(true);
            }),
            Effect.runPromise
        ).then((r) => {
            if (err) throw err.error;
            return r;
        })
    });
}
