import { FileReference } from "../types";
import { UUID } from "../../../utils/exports";
import { SubscriptionCallback } from "../library/subscriptions";

export type ClientSideSubscriptionOperation = {
    type: "SUBSCRIBE_CB",
    fr: FileReference,
    cb: SubscriptionCallback,
    key: UUID
} | {
    type: "UNSUBSCRIBE_CB",
    fr: FileReference,
    key: UUID
} | {
    type: "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE",
    fr: FileReference
}
