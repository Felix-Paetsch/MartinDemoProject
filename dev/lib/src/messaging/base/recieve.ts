import { Effect } from "effect";
import { UnblockFiberDeamon } from "../../utils/promisify";
import { Address } from "./address";
import { applyMiddlewareEffect } from "./apply_middleware_effect";
import { InvalidMessageFormatError } from "./errors/message_errors";
import { RecieveLocalComputedMessageData } from "./local_computed_message_data";
import { Message, MessageT, TransmittableMessage, TransmittableMessageT } from "./message";
import { MiddlewareInterrupt } from "./middleware";
import { send } from "./send";

export const recieve =
    Effect.fn("recieve")(function* (tmsg: TransmittableMessage, recieve_address: Address) {
        const lcmd = RecieveLocalComputedMessageData();
        const msg = yield* tmsg.message;
        const interupt = yield* applyMiddlewareEffect(msg, recieve_address, lcmd);

        if (interupt == MiddlewareInterrupt) {
            return yield* Effect.void;
        }

        return yield* send(msg, lcmd);
    },
        e => e.pipe(
            Effect.provideServiceEffect(
                MessageT,
                TransmittableMessageT.pipe(
                    Effect.andThen(m => m.message)
                )
            ),
            Effect.catchTag("MessageDeserializationError", (err) =>
                Effect.fail(new InvalidMessageFormatError({
                    Message: new Message(Address.local_address, ""),
                    error: err,
                    data: "The message to recieve had bad format."
                }))
            ),
            Effect.catchAll(e => Effect.gen(function* () {
                return yield* Effect.void;
            })),
            UnblockFiberDeamon
        )
    )