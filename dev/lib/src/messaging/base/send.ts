import { Context, Data, Effect, Equal } from "effect";
import { Address } from "./address";
import { applyMiddlewareEffect } from "./apply_middleware_effect";
import { sendThroughCommunicationChannel } from "./communication_channel";
import { findEndpointOrFail } from "./endpoints";
import { applyErrorHandler, applyAnomalyHandler } from "./listen";
import { LocalComputedMessageData, LocalComputedMessageDataT } from "./local_computed_message_data";
import { Message, MessageT } from "./message";
import { MiddlewareInterrupt } from "./middleware";

export class AddressNotFoundError extends Data.TaggedError("AddressNotFoundError")<{
        address: Address;
}> { }

export const send = Effect.fn("send")(function* (msg: Message, currentLocalComputedMessageData: Partial<LocalComputedMessageData> | null = null) {
        const address = msg.target;
        const lcmd: LocalComputedMessageData = {
                ...(currentLocalComputedMessageData || {}),
                at_target: false,
                at_source: false,
                current_address: Address.local_address,
                direction: "incoming"
        };

        // at kernel
        if (!currentLocalComputedMessageData && Equal.equals(address, Address.local_address)) {
                Object.assign(lcmd, {
                        at_target: true,
                        at_source: true,
                        current_address: Address.local_address,
                        direction: "local"
                });

                yield* applyMiddlewareEffect(msg, Address.local_address, lcmd);
                return yield* Effect.void;

        }

        // incoming to kernel at kernel
        if (Equal.equals(address, Address.local_address)) {
                Object.assign(lcmd, {
                        at_target: true,
                        at_source: false,
                        current_address: Address.local_address,
                        direction: "incoming"
                });

                yield* applyMiddlewareEffect(msg, Address.local_address, lcmd);
                return yield* Effect.void;
        } else if (currentLocalComputedMessageData) {
                // incoming to kernel from somewhere else -> run incomming mw
                Object.assign(lcmd, {
                        at_target: false,
                        at_source: false, // !exists_lcmd,
                        current_address: Address.local_address,
                        direction: "incoming"
                });

                const interrupt = yield* applyMiddlewareEffect(msg, Address.local_address, lcmd);

                if (interrupt == MiddlewareInterrupt) {
                        return yield* Effect.void;
                }
        }

        // Just send to kernel or after processing incommming
        const endpoint = yield* findEndpointOrFail(address);

        Object.assign(lcmd, {
                at_target: false,
                at_source: !currentLocalComputedMessageData,
                current_address: Address.local_address,
                direction: "outgoing"
        });

        // Outgoing from kernel 
        const interrupt2 = yield* applyMiddlewareEffect(msg, Address.local_address, lcmd);

        if (interrupt2 == MiddlewareInterrupt) {
                return yield* Effect.void;
        }

        Object.assign(lcmd, {
                at_target: false,
                at_source: false,
                current_address: Address.local_address,
                direction: "outgoing"
        });

        // Outgoing via address
        const interrupt3 = yield* applyMiddlewareEffect(msg, msg.target, lcmd);

        if (interrupt3 == MiddlewareInterrupt) {
                return yield* Effect.void;
        }

        return yield* sendThroughCommunicationChannel(endpoint.communicationChannel, msg.serialize())
})

export type SendEffect = (m: Message) => ReturnType<typeof send>;
export class SendEffectT extends Context.Tag("SendEffectT")<SendEffectT, SendEffect>() { }
