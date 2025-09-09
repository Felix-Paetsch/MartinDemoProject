import { Effect } from "effect";
import { UnblockFiberDeamon } from "../../utils/promisify";
import { Address } from "./address";
import { applyMiddlewareEffect } from "./apply_middleware_effect";
import { JustRecievedLocalData } from "./message";
import { Message, TransmittableMessage } from "./message";
import { isMiddlewareInterrupt } from "./middleware";
import { send } from "./send";
import { HandledError, IgnoreHandled } from "./errors/errors";

export const recieve =
    Effect.fn("recieve")(function* (msg: TransmittableMessage, recieve_address: Address) {
        if (typeof msg === "string") {
            msg = yield* Message.deserialize(msg).pipe(
                Effect.catchAll(HandledError.handleA)
            );
        }

        msg.local_data = JustRecievedLocalData();
        const interupt = yield* applyMiddlewareEffect(msg, recieve_address);

        if (isMiddlewareInterrupt(interupt)) {
            return yield* Effect.void;
        }

        msg.from_external = true;
        return yield* send(msg);
    },
        e => e.pipe(
            IgnoreHandled,
            UnblockFiberDeamon
        )
    )