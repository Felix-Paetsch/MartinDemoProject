import { Effect, Equal, Option, pipe } from "effect";
import { Address } from "./address";
import { AddressAlreadyInUseError, CommunicationChannel, MessageChannelTransmissionError } from "./communication_channel";
import { CallbackRegistrationError } from "./errors/callback_registration";
import { TransmittableMessage } from "./message";
import { Middleware } from "./middleware";
import { AddressNotFoundError, send } from "./send";

export type Endpoint = {
    address: Address;
    communicationChannel: CommunicationChannel;
    middlewares: Middleware[];
    remove: Effect.Effect<void, never, never>;
}

const endpoints: Endpoint[] = [{
    get address() {
        return Address.local_address;
    },
    communicationChannel: {
        address: Address.local_address,
        send: Effect.fn("send")(function* (tm: TransmittableMessage) {
            const msg = yield* tm.message;
            return yield* send(msg)
        }, e => e.pipe(
            Effect.mapError(e => new MessageChannelTransmissionError({ err: e }))
        )),
        recieve_cb: () => Effect.void,
        remove_cb: () => Effect.void
    },
    middlewares: [],
    remove: Effect.void
}];

export const createEndpoint = Effect.fn("createEndpoint")(
    function* (communicationChannel: CommunicationChannel) {
        const new_endpoint = {
            address: communicationChannel.address,
            communicationChannel,
            middlewares: [],
            remove: removeEndpoint(communicationChannel.address)
        };

        yield* findEndpoint(communicationChannel.address).pipe(
            Option.match({
                onNone: () => Effect.void,
                onSome: () => Effect.fail(new AddressAlreadyInUseError({ address: communicationChannel.address }))
            })
        );

        if (typeof communicationChannel.remove_cb == "function") {
            yield* Effect.try(() => {
                return communicationChannel.remove_cb!(new_endpoint.remove)
            }).pipe(
                Effect.catchAll(e => {
                    const err = e instanceof Error ? e : new Error("Couldn't register remove callback");
                    return Effect.all([
                        new_endpoint.remove,
                        Effect.fail(new CallbackRegistrationError({
                            error: err,
                            message: "Couldn't register remove callback"
                        })),
                    ])
                })
            );
        }

        endpoints.push(new_endpoint);
        return new_endpoint;
    }
)

export const removeEndpoint = Effect.fn("removeEndpoint")(
    function* (address: Address) {
        const index = endpoints.findIndex(endpoint => Equal.equals(endpoint.address, address));
        if (index > -1) {
            endpoints.splice(index, 1);
        }
    }
);

export const findEndpoint = (address: Address): Option.Option<Endpoint> =>
    Option.fromNullable(
        endpoints.find(endpoint => Equal.equals(endpoint.address, address))
    ).pipe(Option.orElse(() => Option.fromNullable(
        endpoints.find(endpoint => Equal.equals(endpoint.address, address.as_generic()))
    )));

export const findEndpointOrFail = (address: Address): Effect.Effect<Endpoint, AddressNotFoundError> =>
    pipe(
        findEndpoint(address),
        Effect.orElseFail(() => new AddressNotFoundError({ address }))
    )