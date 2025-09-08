import { Effect } from "effect";
import { runEffectAsPromise } from "./run";

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

export function syncCallbackAsEffect<
    Args extends any[],
    R
>(
    cb: (...args: Args) => R
): (...args: Args) => Effect.Effect<R, CallbackError> {
    return Effect.fn("syncCallbackAsEffect")(function* (
        ...args: Args
    ) {
        return yield* Effect.try({
            try: () => cb(...args),
            catch: (e) => new CallbackError(e as Error),
        });
    });
}

export function asyncCallbackAsEffect<
    Args extends any[],
    R
>(
    cb: (...args: Args) => Promise<R>
): (...args: Args) => Effect.Effect<R, CallbackError> {
    return Effect.fn("asyncCallbackAsEffect")(function* (
        ...args: Args
    ) {
        return yield* Effect.tryPromise({
            try: () => cb(...args),
            catch: (e) => new CallbackError(e as Error),
        });
    });
}

export function callbackAsEffect<
    Args extends any[]
>(cb: (...args: Args) => void | Promise<void>, ...args: Args): Effect.Effect<void, CallbackError> {
    return Effect.suspend(() => callbackAsEffectFn(cb)(...args));
}

export function callbackAsEffectFn<
    Args extends any[],
>(
    cb: (...args: Args) => void | Promise<void>
): (...args: Args) => Effect.Effect<void, CallbackError> {
    return Effect.fn("callbackAsEffectFn")(function* (
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

export function syncCallbackAsResult<
    Args extends any[],
    R
>(cb: (...args: Args) => R) {
    return (...args: Args) =>
        runEffectAsPromise(syncCallbackAsEffect(cb)(...args));
}

export function asyncCallbackAsResult<
    Args extends any[],
    R
>(cb: (...args: Args) => Promise<R>) {
    return (...args: Args) =>
        runEffectAsPromise(asyncCallbackAsEffect(cb)(...args));
}

export function callbackAsResult<
    Args extends any[]
>(cb: (...args: Args) => void | Promise<void>) {
    return (...args: Args) =>
        runEffectAsPromise(callbackAsEffect(cb, ...args));
}