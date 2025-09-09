import { Effect, Equal, Option, pipe, flow } from "effect";
import { Address } from "./address";
import { CommunicationChannel, InternalCommunicationChannel, toInternalCommunicationChannel } from "./communication_channel";
import { AddressAlreadyInUseError } from "./errors/errors";
import { AddressNotFound } from "./errors/anomalies";
import { Middleware } from "./middleware";
import { HandledError } from "./errors/errors";
import { callbackToEffectUnhandled } from "./errors/main";
import { send } from "./send";

export type Endpoint = {
    address: Address;
    communicationChannel: InternalCommunicationChannel;
    middlewares: Middleware[];
    remove: () => void;
}

const endpoints: Endpoint[] = [{
    get address() {
        return Address.local_address;
    },
    communicationChannel: {
        address: Address.local_address,
        send: flow(send, Effect.ignore, Effect.runPromise),
        recieve_cb: () => { },
        remove_cb: () => { }
    },
    middlewares: [],
    remove: () => Promise.resolve()
}];

export const createEndpoint = Effect.fn("createEndpoint")(
    function* (communicationChannel: CommunicationChannel) {
        const new_endpoint: Endpoint = {
            address: communicationChannel.address,
            communicationChannel: toInternalCommunicationChannel(communicationChannel),
            middlewares: [],
            remove: () => removeEndpoint(communicationChannel.address)
        };

        yield* findEndpoint(communicationChannel.address).pipe(
            Option.match({
                onNone: () => Effect.void,
                onSome: () => Effect.fail(new AddressAlreadyInUseError(communicationChannel.address))
            })
        );

        if (typeof communicationChannel.remove_cb == "function") {
            yield* callbackToEffectUnhandled(
                communicationChannel.remove_cb.bind(communicationChannel),
                () => Promise.resolve(new_endpoint.remove())
            )
        }

        endpoints.push(new_endpoint);
        return new_endpoint;
    }
)

export function removeEndpoint(address: Address) {
    const index = endpoints.findIndex(endpoint => Equal.equals(endpoint.address, address));
    if (index > -1) {
        endpoints.splice(index, 1);
    }
}

export const findEndpoint = (address: Address): Option.Option<Endpoint> =>
    Option.fromNullable(
        endpoints.find(endpoint => Equal.equals(endpoint.address, address))
    ).pipe(Option.orElse(() => Option.fromNullable(
        endpoints.find(endpoint => Equal.equals(endpoint.address, address.as_generic()))
    )));

export const findEndpointOrFail = (address: Address): Effect.Effect<Endpoint, HandledError> =>
    pipe(
        findEndpoint(address),
        Effect.orElse(() => HandledError.handleA(new AddressNotFound(address)))
    )