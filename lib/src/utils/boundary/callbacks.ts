import { Effect } from "effect";
import { EffectToResult } from "./run";

export class CallbackError extends Error {
    constructor(readonly error: Error) {
        super("Callback Error", { cause: error });
        Object.setPrototypeOf(this, new.target.prototype);
    }

    override get message() {
        return `${this.error.name} ${this.error.message}`;
    }

    override get stack(): string | undefined {
        return `CallbackError: ${this.message}\n${super.stack}\n<><><> Original Error <><><>\n${this.error.stack}`;
    }

    override toString() {
        return this.stack ?? this.message;
    }
}

export function syncCallbackToEffectFn<
    Args extends any[],
    R
>(
    cb: (...args: Args) => R
): (...args: Args) => Effect.Effect<R, CallbackError> {
    return (...args: Args) => Effect.try({
        try: () => cb(...args),
        catch: (e) => new CallbackError(e as Error),
    }).pipe(Effect.withSpan("syncCallbackAsEffect"));
}

export function syncCallbackToEffect<
    Args extends any[],
    R
>(cb: (...args: Args) => R, ...args: Args) {
    return syncCallbackToEffectFn(cb)(...args);
}

export function asyncCallbackToEffectFn<
    Args extends any[],
    R
>(
    cb: (...args: Args) => Promise<R>
): (...args: Args) => Effect.Effect<R, CallbackError> {
    return (...args: Args) => Effect.tryPromise({
        try: () => cb(...args),
        catch: (e) => new CallbackError(e as Error),
    }).pipe(Effect.withSpan("asyncCallbackAsEffect"));
}

export function asyncCallbackToEffect<
    Args extends any[],
    R
>(
    cb: (...args: Args) => Promise<R>, ...args: Args
) {
    return asyncCallbackToEffectFn(cb)(...args)
}

export function callbackToEffectFn<
    Args extends any[],
>(
    cb: (...args: Args) => void | Promise<void>
): (...args: Args) => Effect.Effect<void, CallbackError> {
    return Effect.fn("callbackToEffectFn")(function* (
        ...args: Args
    ) {
        const res = yield* Effect.try({
            try: () => cb(...args),
            catch: (e) => new CallbackError(e as Error),
        });

        if (res instanceof Promise) {
            return yield* Effect.tryPromise({
                try: () => res,
                catch: (e) => new CallbackError(e as Error),
            });
        } else {
            return res;
        }
    });
}

export function callbackToEffect<
    Args extends any[]
>(cb: (...args: Args) => void | Promise<void>, ...args: Args): Effect.Effect<void, CallbackError> {
    return callbackToEffectFn(cb)(...args);
}

export function syncCallbackToResultFn<
    Args extends any[],
    R
>(cb: (...args: Args) => R) {
    return (...args: Args) => EffectToResult(syncCallbackToEffect(cb, ...args));
}

export function syncCallbackToResult<
    Args extends any[],
    R
>(cb: (...args: Args) => R, ...args: Args) {
    return syncCallbackToResultFn(cb)(...args);
}

export function asyncCallbackToResultFn<
    Args extends any[],
    R
>(cb: (...args: Args) => Promise<R>) {
    return (...args: Args) => EffectToResult(asyncCallbackToEffect(cb, ...args));
}

export function asyncCallbackToResult<
    Args extends any[],
    R
>(cb: (...args: Args) => Promise<R>, ...args: Args) {
    return asyncCallbackToResultFn(cb)(...args);
}

export function callbackToResultFn<
    Args extends any[]
>(cb: (...args: Args) => void | Promise<void>) {
    return (...args: Args) => EffectToResult(callbackToEffect(cb, ...args));
}

export function callbackToResult<
    Args extends any[]
>(cb: (...args: Args) => void | Promise<void>, ...args: Args) {
    return callbackToResultFn(cb)(...args);
}
