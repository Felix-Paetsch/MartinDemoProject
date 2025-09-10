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

    static handleE(error: MessagingError) {
        return Effect.gen(function* () {
            if (error instanceof HandledError) {
                return yield* Effect.fail(error);
            }
            yield* applyErrorHandler(error);
            return yield* Effect.fail(new HandledError(error.error));
        })
    }

    static handleA(error: Anomaly) {
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

export class PortClosedError extends Error {
    constructor(readonly port: Port) {
        super("Port is currently closed: " + port.id.toString());
    }
}

export class AddressAlreadyInUseError extends Error {
    constructor(readonly address: Address) {
        super("Address Already In Use: " + address.toString(), { cause: address });
    }
}

export class CallbackError extends Error {
    constructor(readonly error: Error) {
        super("Callback Error: " + error.message, { cause: error });
    }
}

export type MessagingError = CallbackError;