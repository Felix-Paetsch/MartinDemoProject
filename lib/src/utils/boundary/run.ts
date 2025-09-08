import { Effect } from "effect";
import { asyncCallbackAsEffect } from "./callbacks";
import { createFailure, Failure, Result, ResultPromise, Success } from "./result";

export function dangerouslyRunPromise<T>(e: Effect.Effect<T>): Promise<T> {
    return Effect.runPromise(e);
}

export function runEffectAsPromise<T, E extends Error>(e: Effect.Effect<T, E>): ResultPromise<T, E> {
    return Effect.runPromise(e.pipe(
        Effect.map(res => new Success(res)),
        Effect.catchAllCause(cause => Effect.succeed(cause))
    )).then(res => {
        if (res instanceof Success) { return res; }
        const f = createFailure(res as any, 2) as Failure<E>;
        return f;
    });
}

export function runEffectAsPromiseFlash<T, E extends Error>(e: Effect.Effect<T, E>): ResultPromise<null, E> {
    return runEffectAsPromise(e.pipe(Effect.as(null)));
}

export function EffectAsPromise<T, E extends Error>(e: Effect.Effect<T, E>): () => Promise<Result<T, E>> {
    return () => runEffectAsPromise(e)
}

export function EffectAsPromiseFlash<T, E extends Error>(e: Effect.Effect<T, E>): () => Promise<Result<null, E>> {
    return () => runEffectAsPromiseFlash(e)
}

export function ResultToEffect<T, E extends Error>(r: Result<T, E>): Effect.Effect<T, Exclude<Failure<E>, Failure<never>>>;
export function ResultToEffect<T, E extends Error>(r: ResultPromise<T, E>): Effect.Effect<T, Exclude<Failure<E>, Failure<never>>>;
export function ResultToEffect<T, E extends Error>(r: Result<T, E> | ResultPromise<T, E>): Effect.Effect<T, Exclude<Failure<E>, Failure<never>>> {
    if (r instanceof Promise) {
        const res = asyncCallbackAsEffect(() => r)();
        // @effect-diagnostics-next-line missingEffectError:off
        return res.pipe(
            Effect.catchAll(e => Effect.die(e)),
            Effect.andThen(r => {
                if (r instanceof Failure) return Effect.fail(r as any).pipe(
                    Effect.withSpan("ResultToEffect")
                );
                return Effect.succeed(r.value).pipe(
                    Effect.withSpan("ResultToEffect")
                );
            }));
    }

    // @effect-diagnostics-next-line missingEffectError:off
    if (r instanceof Failure) return Effect.fail(r as any).pipe(
        Effect.withSpan("ResultToEffect")
    );
    return Effect.succeed(r.value).pipe(
        Effect.withSpan("ResultToEffect")
    );
}
