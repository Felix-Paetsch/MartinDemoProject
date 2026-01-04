import { Data, Effect } from "effect";
import { Anomaly } from "./anomalies";
import { applyAnomalyHandler, applyErrorHandler } from "./main";

export class HandledError extends Data.TaggedError("HandledError")<{
    error: Error;
}> {
    constructor(readonly error: Error) {
        super({ error });
    }

    static async handleException(error: MessagingError | HandledError) {
        if (error instanceof HandledError) {
            return error;
        }
        await applyErrorHandler(error).pipe(Effect.runPromise);
        return new HandledError(error.error);
    }

    static async handleAnomary(error: Anomaly | HandledError) {
        if (error instanceof HandledError) {
            return error;
        }

        await applyAnomalyHandler(error).pipe(Effect.runPromise);
        return new HandledError(error);
    }
}

export function IgnoreHandled<R, S, T>(e: Effect.Effect<R, S, T>): Effect.Effect<R | void, Exclude<S, HandledError>, T> {
    return e.pipe(
        Effect.catchAll(e => {
            if (e instanceof HandledError) {
                return Effect.succeed(undefined as void);
            }
            return Effect.fail(e as Exclude<S, HandledError>);
        })
    )
}

export class CallbackError extends Data.TaggedError("CallbackError")<{
    error: Error
}> { }

export type MessagingError = CallbackError;
