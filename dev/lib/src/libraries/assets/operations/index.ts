import { CreateOperationS } from "../operations/create";
import { DeleteOperationS } from "../operations/delete";
import { GetFileOperationS, GetMetaDataOperationS } from "../operations/file";
import { ForeceWriteOperationS, WriteOperationS } from "../operations/write";
import { PatchOperationS } from "../operations/patch";
import { DeleteByMetaDataOperationS, FilterByMetaDataOperationS, ForceSetMetaDataOperationS, SetMetaDataOperationS, UpdateMetaDataOperationS } from "../operations/meta_data";
import { ActiveFilesOperationS, AssetSideSubscriptionOperation, SubscribeOperationS, SubscriptionOperation, UnsubscribeOperationS } from "../operations/subscribe";
import { Schema } from "effect";

const DataBaseOperationS = Schema.Union(
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

export const BaseOperationS = Schema.Union(
    DataBaseOperationS,
    SubscribeOperationS,
    UnsubscribeOperationS,
    ActiveFilesOperationS
)

export type AssetSideBaseOperation = Schema.Schema.Type<typeof BaseOperationS>;
export type ClientSideBaseOperation = Schema.Schema.Type<typeof DataBaseOperationS> | SubscriptionOperation;

