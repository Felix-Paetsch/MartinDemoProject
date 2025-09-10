import { Effect } from "effect";
import { Address, LocalAddress } from "../../../messaging/base/address";
import { CommunicationChannel, registerCommunicationChannel } from "../../../messaging/base/lib/communication_channel";
import { LocalComputedMessageData } from "../../../messaging/base/local_computed_message_data";
import { Message, MessageT, TransmittableMessage, TransmittableMessageT } from "../../../messaging/base/message";
import { isMiddlewareInterrupt, Middleware, MiddlewareInterrupt, useMiddleware } from "../../../messaging/base/middleware";
import { AddressNotFoundError } from "../../../messaging/base/lib/send";
import { harpoon_middleware } from "../../../messaging/middleware/collection";
import { Environment } from "./environment";

export const createLocalEnvironment = Effect.fn("createLocalEnvironment")(
    function* (ownAddress: LocalAddress, onMessageForOutsideWorld: Effect.Effect<void, never, MessageT> = Effect.void) {
        let _onMessageForKernelRecieved: Effect.Effect<void, AddressNotFoundError | MessageChannelTransmissionError, TransmittableMessageT> = Effect.void;
        let remove_effect: Effect.Effect<void, never, never> = Effect.void;

        const communication_channel: CommunicationChannel = {
            address: ownAddress,
            send: (tm: TransmittableMessage) => onMessageForOutsideWorld.pipe(
                Effect.provideServiceEffect(MessageT, tm.message),
                Effect.mapError(err => new MessageChannelTransmissionError({ err }))
            ),
            recieve_cb: (onMessageForKernelRecieved: Effect.Effect<void, never, TransmittableMessageT>) => {
                _onMessageForKernelRecieved = onMessageForKernelRecieved;
            },
            remove_cb: (_remove_effect: Effect.Effect<void, never, never>) => {
                remove_effect = _remove_effect;
            }
        }

        yield* registerCommunicationChannel(communication_channel).pipe(
            Effect.catchTag("CallbackRegistrationError", (e) => Effect.die(e))
        );

        const own_mw = harpoon_middleware();
        const middle_mw = harpoon_middleware();

        const res: Environment & {
            useSendMiddleware: (middleware: Middleware) => Effect.Effect<void, never, never>
        } = {
            address: ownAddress,
            send: (m: Message) => _onMessageForKernelRecieved.pipe(
                Effect.provideService(TransmittableMessageT, m.as_transmittable())
            ),
            remove: remove_effect,
            useMiddleware: (middleware: Middleware) => Effect.sync(() => {
                own_mw.push(middleware);
            }),
            useSendMiddleware: (middleware: Middleware) => Effect.sync(() => {
                middle_mw.push(middleware);
            }),
            // is_active: () => active
        }

        yield* useMiddleware({
            middleware: localEndpointMiddleware(
                middle_mw(),
                own_mw(),
                ownAddress
            ),
            address: ownAddress
        }).pipe(Effect.orDie);

        return res;
    }
);

const localEndpointMiddleware = (
    before_endpoint: Middleware,
    at_endpoint: Middleware,
    address: Address
) => Effect.fn("localEndpointMiddleware")(
    function* (msg: Message, message_data: LocalComputedMessageData) {
        if (message_data.direction === "incoming") {
            const first_message_data: LocalComputedMessageData = {
                ...message_data,
                direction: "outgoing",
                at_source: true,
                at_target: false,
                current_address: address,
            }

            const interupt = yield* at_endpoint(msg, first_message_data);
            if (isMiddlewareInterrupt(interupt)) {
                return interupt;
            }

            const r = yield* before_endpoint(msg, message_data);
            return r;
        }

        const interupt = yield* before_endpoint(msg, message_data);
        if (isMiddlewareInterrupt(interupt)) {
            return interupt;
        }

        const second_message_data: LocalComputedMessageData = {
            ...message_data,
            direction: "incoming",
            at_source: false,
            at_target: true,
            current_address: address,
        }

        return yield* at_endpoint(msg, second_message_data);
    }
);