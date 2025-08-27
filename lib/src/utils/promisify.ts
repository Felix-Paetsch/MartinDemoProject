import { Effect } from "effect";

export function PromisifyDeamon<R>(e: Effect.Effect<void, never, R>) {
    return Effect.gen(function* () {
        yield* Effect.forkDaemon(e)
        yield* Effect.sleep("10 millis");
        return yield* Effect.void;
    })
}

export function Promisify<R>(e: Effect.Effect<void, never, R>) {
    return Effect.gen(function* () {
        yield* Effect.fork(e)
        yield* Effect.sleep("10 millis");
        return yield* Effect.void;
    })
}