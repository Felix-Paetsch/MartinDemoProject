import { Effect } from "effect";
import { Message } from "./message";
import { callbackToEffect } from "./errors/main";

export const MiddlewareInterrupt = true as const;
export const MiddlewareContinue = false as const;
type MiddlewareInterrupt = typeof MiddlewareInterrupt;
type MiddlewareContinue = typeof MiddlewareContinue | void | undefined;
export type MiddlewarePassthrough = MiddlewareInterrupt | MiddlewareContinue;

export function isMiddlewareInterrupt(interrupt: MiddlewarePassthrough): interrupt is MiddlewareInterrupt {
    return interrupt === MiddlewareInterrupt;
}

export function isMiddlewareContinue(interrupt: MiddlewarePassthrough): interrupt is MiddlewareContinue {
    return interrupt !== MiddlewareInterrupt;
}

export type Middleware = (message: Message) => MiddlewarePassthrough | Promise<MiddlewarePassthrough>;

export const global_middleware: Middleware[] = [];
export const register_global_middleware = (middleware: Middleware): void => {
    global_middleware.push(middleware);
}
export const clear_global_middleware = (): void => {
    global_middleware.length = 0;
}

export const applyMiddlewareEffect =
    Effect.fn("applyMiddlewareEffect")(function* (msg: Message, middlewares: Middleware[]) {
        for (const middleware of middlewares) {
            const interrupt = yield* callbackToEffect(middleware, msg);
            if (isMiddlewareInterrupt(interrupt)) {
                return MiddlewareInterrupt;
            }
        }

        return MiddlewareContinue;
    }); 1