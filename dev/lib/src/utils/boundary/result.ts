import { Cause } from "effect";
import { CallbackError } from "./callbacks";

export class Success<Res> {
    readonly is_error = false;
    constructor(readonly value: Res) { }
    static promise<S>(r: S): ResultPromise<S, never> {
        return Promise.resolve(new Success(r))
    }
    static empty(): ResultPromise<void, never> {
        return Promise.resolve(new Success(undefined))
    }
}

export function createFailure(
    cause: Cause.Fail<CallbackError> | Cause.Die | Cause.Interrupt | Cause.Empty | Cause.Sequential<any> | Cause.Parallel<any>,
    lines_to_drop?: number
): Failure<Error>;
export function createFailure<Err extends Error>(
    cause: Cause.Fail<Err>,
    lines_to_drop?: number
): Failure<Err>;
export function createFailure<Err extends Error>(
    cause: Cause.Cause<Err>, lines_to_drop: number = 1
): Failure<Err> | Failure<Error> {
    if (Cause.isFailType(cause)) {
        if (cause.error instanceof CallbackError) {
            /*console.log("==========================");
            console.log(cause.error);
            const f = new Failure<Error>(
                Cause.prettyErrors(cause)[0]!,
                cause.error.error,
                cause,
                0
            );*/
            return Failure.from_error(cause.error.error);
        }

        return new Failure(
            Cause.prettyErrors(cause)[0]!,
            cause.error,
            cause,
            lines_to_drop
        )
    }

    if (Cause.isInterruptType(cause)) {
        return new Failure(
            Cause.prettyErrors(cause)[0]!,
            new Error("Fiber was interrupted"),
            cause,
            lines_to_drop
        )
    }

    if (Cause.isSequentialType(cause)) {
        return new Failure(
            Cause.prettyErrors(cause)[0]!,
            new AggregateError([
                createFailure<Err>(cause.left as any),
                createFailure<Err>(cause.right as any)
            ]),
            cause,
            lines_to_drop
        )
    }

    if (Cause.isParallelType(cause)) {
        cause.left;
        cause.right;
        return new Failure(
            Cause.prettyErrors(cause)[0]!,
            new AggregateError([
                createFailure<Err>(cause.left as any),
                createFailure<Err>(cause.right as any)
            ]),
            cause,
            lines_to_drop
        )
    }

    if (Cause.isEmpty(cause)) {
        return new Failure(
            Cause.prettyErrors(Cause.die("Called create failure with no error"))[0]!,
            new Error("Called create failure with no error"),
            cause,
            lines_to_drop
        )
    }

    return new Failure(
        Cause.prettyErrors(cause)[0]!,
        (cause as any).defect as Err,
        cause,
        lines_to_drop
    )
}

export class Failure<Err extends Error> extends Error {
    readonly is_error = true;
    constructor(
        readonly pretty_error: Cause.PrettyError,
        readonly error: Err,
        readonly cause?: Cause.Cause<Error>,
        readonly lines_to_drop?: number
    ) {
        super(error.message, {
            cause: {
                cause: cause,
                original_error: error,
                pretty_error: pretty_error
            }
        });

        this.stack = "Failure: " + this.message + "\n" + String(this.stack?.split("\n").slice(1 + (lines_to_drop || 0)).join("\n"));
    }

    static from_error<Err extends Error>(error: Err): Failure<Err> {
        const res = new Failure<Err>(
            Cause.prettyErrors(Cause.fail(error))[0]!,
            error,
            Cause.fail(error)
        );

        res.stack = error.stack;
        return res;
    }
    static promise<Err extends Error>(r: Err): ResultPromise<never, Err> {
        return Promise.resolve(Failure.from_error(r))
    }
}

export type Result<Res, Err extends Error> = Success<Res> | Failure<Err>;
export type ResultPromise<Res, Err extends Error> = Promise<Success<Res> | Failure<Err>>;