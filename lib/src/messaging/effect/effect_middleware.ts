import { Effect, flow } from "effect";
import { Message } from "../core/message";
import { MiddlewarePassthrough, Middleware } from "../core/middleware";
import { CallbackError } from "../../utils/exports";

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
