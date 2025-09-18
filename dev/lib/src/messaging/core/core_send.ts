import { Effect, Equal, Schema } from "effect";
import { Address } from "./address";
import { applyMiddlewareEffect } from "./middleware";
import { TransmittableMessage } from "./message";
import { isMiddlewareInterrupt } from "./middleware";
import { HandledError, IgnoreHandled } from "./errors/errors";
import { AddressNotFound, MessageDeserializationError } from "./errors/anomalies";
import { MessageFromString } from "../../messagingEffect/schemas";
import { global_middleware } from "./middleware";
import { Connection } from "./connection";
import { UnblockFiberDeamon } from "../../utils/promisify";

export const core_send: (m: TransmittableMessage) => Effect.Effect<void, never, never> = Effect.fn("send")(function* (msg: TransmittableMessage) {
    if (typeof msg === "string") {
        msg = yield* Schema.decode(MessageFromString)(msg)
            .pipe(
                Effect.mapError(() => new MessageDeserializationError({
                    serialized: msg as string
                })),
                Effect.catchAll(HandledError.handleA)
            );
    }

    Object.assign(msg.local_data, {
        at_target: false,
        at_source: false,
        current_address: Address.local_address,
        direction: "at_kernel"
    });

    const interrupt = yield* applyMiddlewareEffect(msg, global_middleware);
    if (isMiddlewareInterrupt(interrupt)) {
        return yield* Effect.void;
    }
    let outConnection = Connection.open_connections.find(c => Equal.equals(c.address, msg.target));
    if (!outConnection) {
        const generic_target = msg.target.as_generic();
        outConnection = Connection.open_connections.find(c => {
            return c.address.as_generic().equals(generic_target);
        });
    }
    if (!outConnection) {
        return yield* HandledError.handleA(new AddressNotFound(msg.target));
    }

    yield* outConnection.__send_message(msg);
}, e => e.pipe(
    IgnoreHandled,
    UnblockFiberDeamon
))
