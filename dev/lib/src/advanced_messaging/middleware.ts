import { Effect, flow } from "effect";
import { Middleware, MiddlewarePassthrough } from "../messaging/core/middleware";
import { CallbackError } from "../messaging/core/errors/errors";
import { Message } from "../messaging/core/message";

export type MiddlewareEffect = (message: Message) => Effect.Effect<MiddlewarePassthrough, CallbackError>;

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
