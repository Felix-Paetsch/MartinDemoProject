import { Effect } from "effect";

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
