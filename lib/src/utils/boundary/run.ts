import { Effect } from "effect";

export function EffectToPromise<T, E>(e: Effect.Effect<T, E>): Promise<T | E> {
    return e.pipe(
        Effect.merge,
        Effect.runPromise
    );
}

export function EffectToPromiseFn<T, E extends Error>(e: Effect.Effect<T, E>): () => Promise<T | E> {
    return () => EffectToPromise(e);
}

export function EffectToPromiseFlashFn<T, E extends Error>(e: Effect.Effect<T, E>): () => Promise<void | E> {
    return EffectToPromiseFn(e.pipe(Effect.as(undefined as void)));
}

export function EffectToPromiseFlash<T, E extends Error>(e: Effect.Effect<T, E>): Promise<void | E> {
    return EffectToPromise(e.pipe(Effect.as(undefined as void)));
}

export function PromiseToEffect<T>(p: Promise<T> | (() => Promise<T>)): Effect.Effect<Exclude<T, Error>, T & Error> {
    if (typeof p === "function") {
        return Effect.suspend(() => PromiseToEffect(p()));
    }

    return Effect.promise(() => p).pipe(
        Effect.flatMap((r) => {
            if (r instanceof Error) {
                return Effect.fail(r);
            }
            return Effect.succeed(r as Exclude<T, Error>);
        })
    )
}
