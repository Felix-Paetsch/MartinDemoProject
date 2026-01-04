import { Effect } from "effect";
import { Anomaly } from "./anomalies";
import { applyAnomalyHandler, applyErrorHandler } from "./main";

export class HandledError extends Error {
    constructor(readonly error: Error) {
        // @ts-ignore
        super(error.name, { error });
    }

    static async handleException(error: Error | HandledError) {
        if (error instanceof HandledError) {
            return error;
        }
        await applyErrorHandler(error);
        return new HandledError(error);
    }

    static async handleAnomary(error: Anomaly | HandledError) {
        if (error instanceof HandledError) {
            return error;
        }

        await applyAnomalyHandler(error);
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
