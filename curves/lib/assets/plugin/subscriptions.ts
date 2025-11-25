import { Address } from "pc-messaging-kernel/messaging";
import { FileReference, SubscriptionCallback } from "../types";
import { PluginEnvironment } from "pc-messaging-kernel/plugin";
import { FileEvent } from "../types";

export const active_subscriptions: {
    fr: FileReference,
    key: string,
    cb: SubscriptionCallback,
    own_address: Address
}[] = [];

export function trigger_file_event(env: PluginEnvironment, evt: FileEvent) {
    for (let i = 0; i < active_subscriptions.length; i++) {
        if (
            active_subscriptions[i]?.own_address.equals(env.address)
            && active_subscriptions[i]?.fr === evt.file_reference
        ) {
            active_subscriptions[i]?.cb(evt);
        }
    }

    return "OK";
}

