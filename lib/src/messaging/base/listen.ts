import { Context, Data, Effect, Option } from "effect";
import { CallbackRegistrationError } from "./errors/callback_registration";
import { LocalComputedMessageDataT } from "./local_computed_message_data";
import { Message, MessageT, SerializedMessage, SerializedMessageT } from "./message";

export type ListenerEffect = Effect.Effect<void, never, MessageT | LocalComputedMessageDataT>
export class ListenerT extends Context.Tag("ListenerT")<ListenerT, {
    listen: ListenerEffect,
    remove_cb?: (remove_effect: Effect.Effect<void, never, never>) => void;
}>() { }

const registered_listeners: ListenerEffect[] = [];

const removeListenerEffect = Effect.fn("removeListenerEffect")(
    function* (listener: ListenerEffect) {
        const index = registered_listeners.indexOf(listener);
        if (index == -1) {
            return yield* Effect.void;
        }
        registered_listeners.splice(index, 1);
        return yield* Effect.void;
    }
);

export const listen = Effect.fn("listen")(function* () {
    const { listen, remove_cb } = yield* ListenerT;

    registered_listeners.push(listen);
    const remove_effect = removeListenerEffect(listen);

    if (typeof remove_cb == "function") {
        yield* Effect.try(() => {
            return remove_cb(remove_effect)
        }).pipe(Effect.catchAll(e => {
            const err = e instanceof Error ? e : new Error("Couldn't register remove callback");
            return Effect.all([
                remove_effect,
                Effect.fail(new CallbackRegistrationError({
                    message: "Couldn't register remove callback",
                    error: err
                })),
            ])
        }));
    }

    return yield* Effect.void;
});

export const applyListeners = Effect.gen(function* () {
    for (const listener of registered_listeners) {
        yield* listener;
    }
    return yield* Effect.void;
});

// ============

export class MessageProcessingError extends Data.TaggedError("MessageProcessingError")<{
    error: Error;
}> { }

export class MessageProcessingErrorT extends Context.Tag("MessageProcessingErrorT")<MessageProcessingErrorT, {
    error: MessageProcessingError;
    data: {
        serialized: SerializedMessage
    } | null;
    Message: Message | null;
}>() { }

export type ErrorListenEffect = Effect.Effect<void, never, MessageProcessingErrorT>;
export type ErrorListener = {
    listen: ErrorListenEffect,
    remove_cb?: (remove_effect: Effect.Effect<void, never, never>) => void;
}

const registered_error_listeners: ErrorListenEffect[] = [];

const removeErrorListenerEffect = Effect.fn("removeErrorListenerEffect")(
    function* (listener: ErrorListenEffect) {
        const index = registered_error_listeners.indexOf(listener);
        if (index == -1) {
            return yield* Effect.void;
        }
        registered_error_listeners.splice(index, 1);
        return yield* Effect.void;
    }
);

export const listenMessageProcessingError = Effect.fn("listenMessageProcessingError")(
    function* (ErrorListener: ErrorListener) {
        const { listen, remove_cb } = ErrorListener;

        registered_error_listeners.push(listen);
        const remove_effect = removeErrorListenerEffect(listen);

        if (typeof remove_cb == "function") {
            yield* Effect.try(() => {
                return remove_cb(remove_effect)
            }).pipe(Effect.catchAll(e => {
                const err = e instanceof Error ? e : new Error("Couldn't register remove callback");
                return Effect.all([
                    remove_effect,
                    Effect.fail(new CallbackRegistrationError({
                        message: "Couldn't register remove callback",
                        error: err
                    })),
                ])
            }));
        }

        return yield* Effect.void;
    });

export const applyMessageProcessingErrorListeners = (e: Error) => Effect.gen(function* () {
    for (const listener of registered_error_listeners) {
        yield* listener;
    }
    return yield* Effect.void;
}).pipe(
    Effect.provideServiceEffect(MessageProcessingErrorT, Effect.gen(function* () {
        const msgO = yield* Effect.serviceOption(MessageT)
        const msg = Option.isNone(msgO) ? null : msgO.value;

        const serialized_msgO = yield* Effect.serviceOption(SerializedMessageT)
        const serialized_msg = Option.isNone(serialized_msgO) ? null : serialized_msgO.value;

        return {
            error: new MessageProcessingError({
                error: e
            }),
            data: serialized_msg ? { serialized: serialized_msg } : null,
            Message: msg
        }
    })),
);
