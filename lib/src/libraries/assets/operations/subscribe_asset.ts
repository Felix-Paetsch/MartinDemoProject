import { Schema } from "effect";
import { FileReferenceS } from "../schemas";

export const AssetSubscribeFileReferenceOperationS = Schema.Struct({
    type: Schema.Literal("SUBSCRIBE_FILE_REFERENCE"),
    fr: FileReferenceS
});

export const AssetUnsubscribeFileReferenceOperationS = Schema.Struct({
    type: Schema.Literal("UNSUBSCRIBE_FILE_REFERENCE"),
    fr: FileReferenceS,
});

export const ActiveFileReferencesOperationS = Schema.Struct({
    type: Schema.Literal("GET_ACTIVE_FILE_REFERENCES")
});

export type AssetSideSubscriptionOperation = Schema.Schema.Type<
    typeof AssetSubscribeFileReferenceOperationS
    | typeof AssetUnsubscribeFileReferenceOperationS
    | typeof ActiveFileReferencesOperationS
>
