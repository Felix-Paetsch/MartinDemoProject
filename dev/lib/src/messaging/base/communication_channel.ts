import { Context, Effect } from "effect";
import { Address } from "./address";
import { createEndpoint } from "./endpoints";
import { Message, SerializedMessage, TransmittableMessage } from "./message";
import { recieve } from "./recieve";
import { callbackToEffectUnhandled } from "./errors/main";

export type CommunicationChannel = {
    address: Address;
    send: (msg: SerializedMessage) => void | Promise<void>;
    recieve_cb: (recieve: (msg: SerializedMessage) => Promise<void>) => void | Promise<void>;
    remove_cb?: (remove: () => Promise<void>) => void | Promise<void>;
};

export type InternalCommunicationChannel = {
    address: Address;
    send: (msg: TransmittableMessage) => void | Promise<void>;
    recieve_cb: (recieve: (msg: string) => Promise<void>) => void;
    remove_cb?: (remove: () => Promise<void>) => void | Promise<void>;
};

export function toInternalCommunicationChannel(cc: CommunicationChannel): InternalCommunicationChannel {
    return {
        address: cc.address,
        send: (msg) => {
            if (msg instanceof Message) {
                return cc.send(msg.serialize());
            }
            return cc.send(msg);
        },
        recieve_cb: cc.recieve_cb,
        remove_cb: cc.remove_cb,
    };
}


export class CommunicationChannelT extends Context.Tag("CommunicationChannelT")<
    CommunicationChannelT, CommunicationChannel
>() { }

export const registerCommunicationChannel = Effect.fn("registerCommunicationChannel")(
    function* (cc: CommunicationChannel) {
        const address = cc.address;

        yield* callbackToEffectUnhandled(cc.recieve_cb, (msg: string) => recieve(msg, address).pipe(Effect.runPromise));

        const ep = yield* createEndpoint(cc);
        if (cc.remove_cb) {
            yield* callbackToEffectUnhandled(cc.remove_cb, () => Promise.resolve(ep.remove())).pipe(
                Effect.tapError(() => Effect.sync(() => ep.remove()))
            );
        }
    }
);
