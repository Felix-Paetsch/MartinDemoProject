import { Context, Effect, Equal } from "effect";
import { Address } from "./address";
import { applyMiddlewareEffect } from "./apply_middleware_effect";
import { findEndpointOrFail } from "./endpoints";
import { Message, TransmittableMessage } from "./message";
import { isMiddlewareInterrupt } from "./middleware";
import { callbackToEffectUnhandled } from "./errors/main";
import { HandledError } from "./errors/errors";
import { MessageChannelTransmissionError } from "./errors/anomalies";

export const send = Effect.fn("send")(function* (msg: TransmittableMessage) {
    if (typeof msg === "string") {
        msg = yield* Message.deserialize(msg).pipe(
            Effect.catchAll(HandledError.handleA)
        );
    }

    const was_sent = msg.from_external;
    const address = msg.target;
    msg.local_data = {
        ...msg.local_data,
        at_target: false,
        at_source: false,
        current_address: Address.local_address,
        direction: "incoming"
    };
    msg.from_external = true;

    // at kernel
    if (!was_sent && Equal.equals(address, Address.local_address)) {
        Object.assign(msg.local_data, {
            at_target: true,
            at_source: true,
            current_address: Address.local_address,
            direction: "local"
        });

        yield* applyMiddlewareEffect(msg, Address.local_address);
        return yield* Effect.void;

    }

    // incoming to kernel at kernel
    if (Equal.equals(address, Address.local_address)) {
        Object.assign(msg.local_data, {
            at_target: true,
            at_source: false,
            current_address: Address.local_address,
            direction: "incoming"
        });

        yield* applyMiddlewareEffect(msg, Address.local_address);
        return yield* Effect.void;
    } else if (was_sent) {
        // incoming to kernel from somewhere else -> run incomming mw
        Object.assign(msg.local_data, {
            at_target: false,
            at_source: false, // !exists_lcmd,
            current_address: Address.local_address,
            direction: "incoming"
        });

        const interrupt = yield* applyMiddlewareEffect(msg, Address.local_address);

        if (isMiddlewareInterrupt(interrupt)) {
            return yield* Effect.void;
        }
    }

    // Just send to kernel or after processing incommming
    const endpoint = yield* findEndpointOrFail(address);

    Object.assign(msg.local_data, {
        at_target: false,
        at_source: !was_sent,
        current_address: Address.local_address,
        direction: "outgoing"
    });

    // Outgoing from kernel 
    const interrupt2 = yield* applyMiddlewareEffect(msg, Address.local_address);

    if (isMiddlewareInterrupt(interrupt2)) {
        return yield* Effect.void;
    }

    Object.assign(msg.local_data, {
        at_target: false,
        at_source: false,
        current_address: Address.local_address,
        direction: "outgoing"
    });

    // Outgoing via address
    const interrupt3 = yield* applyMiddlewareEffect(msg, msg.target);

    if (isMiddlewareInterrupt(interrupt3)) {
        return yield* Effect.void;
    }

    return yield* callbackToEffectUnhandled(endpoint.communicationChannel.send, msg.serialize()).pipe(
        Effect.mapError(e => {
            if (e instanceof HandledError) return e;
            return new MessageChannelTransmissionError(e);
        }),
        Effect.catchAll(HandledError.handleA)
    )
})

export type SendEffect = (m: Message) => ReturnType<typeof send>;
export class SendEffectT extends Context.Tag("SendEffectT")<SendEffectT, SendEffect>() { }
