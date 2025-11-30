import { Address } from "pc-messaging-kernel/messaging";
import { FileReference } from "../types/base";
import { PluginEnvironment } from "pc-messaging-kernel/plugin";
import {
    SubscriptionCallback,
    to_frontend_file_event,
} from "../types/frontend_file_events";
import {
    BoundBackendFileEvent,
} from "../types/backend_file_events";

export const active_subscriptions: {
    fr: FileReference;
    cb: SubscriptionCallback;
    own_address: Address;
    key: string;
}[] = [];

export function trigger_file_events(
    env: PluginEnvironment,
    evt: BoundBackendFileEvent[]
) {
    for (const e of evt) {
        const fe = to_frontend_file_event(e);
        for (let i = 0; i < active_subscriptions.length; i++) {
            const el = active_subscriptions[i]!;
            if (el.key === fe.subscription_key && env.address.equals(el.own_address)) {
                el.cb(fe);

                if (fe.type === "DELETE") {
                    active_subscriptions.splice(i, 1);
                    i--;
                }
            }
        }
    }

    return "OK";
}
