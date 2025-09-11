import { Data, Effect } from "effect";
import { Anomaly } from "./anomalies";
import { applyAnomalyHandler, applyErrorHandler } from "./main";
import { Address } from "../address";
import Port from "../port";

export class HandledError extends Data.TaggedError("HandledError")<{
    error: Error;
}> {
    constructor(readonly error: Error) {
        super({ error });
    }

    static handleE(error: MessagingError | HandledError) {
        return Effect.gen(function* () {
            if (error instanceof HandledError) {
                return yield* Effect.fail(error);
            }
            yield* applyErrorHandler(error);
            return yield* Effect.fail(new HandledError(error.error));
        })
    }

    static handleA(error: Anomaly | HandledError) {
        return Effect.gen(function* () {
            if (error instanceof HandledError) {
                return yield* Effect.fail(error);
            }
            yield* applyAnomalyHandler(error);
            return yield* Effect.fail(new HandledError(error));
        })
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

export class PortClosedError extends Data.TaggedError("PortClosedError")<{
    port: Port
}> { }

export class AddressAlreadyInUseError extends Data.TaggedError("AddressAlreadyInUseError")<{
    address: Address
}> { }

export class CallbackError extends Data.TaggedError("CallbackError")<{
    error: Error
}> { }

export type MessagingError = CallbackError;