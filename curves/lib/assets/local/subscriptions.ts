import { Address } from "pc-messaging-kernel/messaging";
import { ChangeFileContentEvent, ChangeMetaDataEvent, DeleteFileEvent, FileEvent, FileReference } from "../types";
import { SBackendOperation } from "../plugin/process_operation";
import { ActiveSubscriptionResult, SubscribeResult, UnsubscribeResult } from "../operation_result";
import { LocalMethods, PluginMethods } from "../library";
import { Store } from "./state";

type SubscriptionKey = string;
type Subscription = {
    fr: FileReference,
    key: SubscriptionKey,
    address: Address
};

const active_subscriptions: Subscription[] = [];

export function handleSubscriptionOperation(op: SBackendOperation<"SUBSCRIBE_OP">, addr: Address): SubscribeResult {
    active_subscriptions.push({
        address: addr,
        key: op.key,
        fr: op.fr
    });

    return {
        key: op.key,
        fr: op.fr
    }
}

export function handleUnsubscripeOperation(op: SBackendOperation<"UNSUBSCRIBE_OP">, addr: Address): UnsubscribeResult {
    for (let i = active_subscriptions.length - 1; i >= 0; i--) {
        if (
            active_subscriptions[i]!.address.equals(addr)
            && active_subscriptions[i]!.fr === op.fr
            && active_subscriptions[i]!.key === op.key
        ) active_subscriptions.splice(i, 1);
    }
    return null;
}

export function handleGetActiveSubscriptionsOperation(_op: SBackendOperation<"GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE">, addr: Address): ActiveSubscriptionResult {
    return active_subscriptions.filter(s => s.address.equals(addr)).map(s => ({
        fr: s.fr,
        key: s.key
    }))
}


export function trigger_file_events(evt: FileEvent) {
    for (const sub of active_subscriptions) {
        if (sub.fr === evt.file_reference) {
            PluginMethods.trigger_file_event(sub.address, evt)
        }
    }
}

export function change_file_event(fr: FileReference): ChangeFileContentEvent {
    const file = Store[fr]!;

    return {
        file_reference: fr,
        type: "CHANGE_FILE_CONTENT",
        meta_data: file?.meta_data,
        recency_token: file?.recency_token,
        contents: file.contents
    }
}

export function delete_file_event(fr: FileReference): DeleteFileEvent {
    return {
        file_reference: fr,
        type: "DELETE"
    }
}

export function change_meta_data_event(fr: FileReference): ChangeMetaDataEvent {
    const file = Store[fr]!;

    return {
        file_reference: fr,
        type: "CHANGE_META_DATA",
        meta_data: file?.meta_data,
        recency_token: file?.recency_token
    }
}
