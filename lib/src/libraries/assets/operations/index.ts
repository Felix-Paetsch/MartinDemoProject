import { Schema } from "effect";
import { ClientSideSubscriptionOperation } from "./subscribe_client";
import { ActiveFileReferencesOperationS, AssetSubscribeFileReferenceOperationS, AssetUnsubscribeFileReferenceOperationS } from "./subscribe_asset";
import {
    CreateOperationS,
    DeleteByMetaDataOperationS,
    DeleteOperationS,
    FilterByMetaDataOperationS,
    ForceSetMetaDataOperationS,
    ForeceWriteOperationS,
    GetFileOperationS,
    GetMetaDataOperationS,
    PatchOperationS,
    SetMetaDataOperationS,
    UpdateMetaDataOperationS,
    WriteOperationS
} from "./shared";

const SharedOperationS = Schema.Union(
    CreateOperationS,
    DeleteOperationS,
    GetFileOperationS,
    GetMetaDataOperationS,
    ForeceWriteOperationS,
    WriteOperationS,
    PatchOperationS,
    SetMetaDataOperationS,
    ForceSetMetaDataOperationS,
    UpdateMetaDataOperationS,
    FilterByMetaDataOperationS,
    DeleteByMetaDataOperationS,
);

export type ClientSideOperation = Schema.Schema.Type<typeof SharedOperationS> | ClientSideSubscriptionOperation;

export const AssetSideOperationS = Schema.Union(
    SharedOperationS,
    AssetSubscribeFileReferenceOperationS,
    AssetUnsubscribeFileReferenceOperationS,
    ActiveFileReferencesOperationS
)
export type AssetSideOperation = Schema.Schema.Type<typeof AssetSideOperationS>;
