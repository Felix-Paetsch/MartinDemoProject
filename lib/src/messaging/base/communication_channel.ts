import { Context, Data, Effect } from "effect";
import { Address } from "./address";
import { createEndpoint } from "./endpoints";
import { CallbackRegistrationError } from "./errors/callback_registration";
import { SerializedMessage, TransmittableMessage, TransmittableMessageT } from "./message";
import { recieve } from "./recieve";

export type CommunicationChannel = {
    address: Address;
    send: (tm: TransmittableMessage) => Effect.Effect<void, MessageChannelTransmissionError>;
    recieve_cb: (recieve_effect: Effect.Effect<
        void,
        never,
        TransmittableMessageT
    >) => void;
    remove_cb?: (remove_effect: Effect.Effect<void, never, never>) => void;
};
export class CommunicationChannelT extends Context.Tag("CommunicationChannelT")<
    CommunicationChannelT, CommunicationChannel
>() { }

export class MessageChannelTransmissionError extends Data.TaggedError("cc/MessageChannelTransmissionError")<{ err: Error }> { }
export class AddressAlreadyInUseError extends Data.TaggedError("AddressAlreadyInUseError")<{
    address: Address;
}> { }

export const sendThroughCommunicationChannel = Effect.fn("sendThroughCommunicationChannel")(
    function* (channel: CommunicationChannel, serialized_message: string) {
        const tm = new TransmittableMessage(serialized_message as SerializedMessage, channel.address)
        return yield* channel.send(tm)
    }
)

export const registerCommunicationChannel = Effect.fn("registerCommunicationChannel")(
    function* (cc: CommunicationChannel) {
        const address = cc.address;
        const ep = yield* createEndpoint(cc);

        yield* Effect.try(() => {
            cc.recieve_cb(
                Effect.gen(function* () {
                    const tmsg = yield* TransmittableMessageT;
                    return yield* recieve(tmsg, address)
                })
            );

            if (typeof cc.remove_cb == "function") {
                cc.remove_cb(ep.remove);
            }
        }).pipe(Effect.catchAll(e => {
            const err = e instanceof Error ? e : new Error("Couldn't register receive callback");
            return Effect.all([
                ep.remove,
                Effect.fail(new CallbackRegistrationError({
                    error: err,
                    message: "Couldn't register recieve callback"
                })),
            ])
        }));

        return yield* Effect.void;
    }
);
