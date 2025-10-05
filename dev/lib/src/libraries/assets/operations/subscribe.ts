import { Schema } from "effect";
import { FileReferenceS } from "../schemas";
import { FileReference } from "../types";
import { UUID } from "../../../utils/exports";
import { SubscriptionCallback } from "../library/subscriptions";

export const SubscribeOperationS = Schema.Struct({
    type: Schema.Literal("SUBSCRIBE"),
    fr: FileReferenceS
});

export const UnsubscribeOperationS = Schema.Struct({
    type: Schema.Literal("UNSUBSCRIBE"),
    fr: FileReferenceS,
});

export const ActiveFilesOperationS = Schema.Struct({
    type: Schema.Literal("GET_ACTIVE_FILE_REFERENCES")
});

export type AssetSideSubscriptionOperation = Schema.Schema.Type<typeof SubscribeOperationS | typeof UnsubscribeOperationS | typeof ActiveFilesOperationS>

export type SubscriptionOperation = {
    type: "SUBSCRIBE",
    fr: FileReference,
    cb: SubscriptionCallback,
    key: UUID
} | {
    type: "UNSUBSCRIBE",
    fr: FileReference,
    key: UUID
} | {
    type: "GET_ACTIVE_SUBSCRIPTIONS",
    fr: FileReference
}
