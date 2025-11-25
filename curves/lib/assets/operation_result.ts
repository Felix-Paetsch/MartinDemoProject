import { MakeMutable } from "pc-messaging-kernel/utils";
import { BackendOperation } from "./plugin/process_operation";
import { MetaData, RecencyToken, File, FileReference } from "./types";

export type OperationError = string;
export function isOperationError(op: OperationResult): op is OperationError {
    return typeof op == "string";
}

export type FileDataResult = {
    recency_token: RecencyToken,
    meta_data: MetaData
}

export type CreateResult = OperationError | FileDataResult
export type FileResult = OperationError | MakeMutable<File>;
export type WriteResult = OperationError | FileDataResult;
export type ForceWriteResult = WriteResult;
export type DeleteResult = OperationError | { fileExisted: boolean };
export type PatchResult = Error;
export type DescriptionResult = OperationError | FileDataResult;

export type SetMetaDataResult = DescriptionResult | OperationError;
export type ForceSetMetaDataResult = SetMetaDataResult;
export type FilterByMetaDataResult = FileDataResult[] | OperationError;
export type DeleteByMetaDataResult = FileReference[] | OperationError;
export type UpdateMetaDataResult = SetMetaDataResult;

export type ActiveSubscriptionResult = {
    key: string,
    fr: FileReference
}[];
export type SubscribeResult = OperationError | {
    key: string,
    fr: FileReference
};
export type UnsubscribeResult = null;

export type OperationResult =
    CreateResult
    | FileResult
    | WriteResult
    | ForceWriteResult
    | DeleteResult
    | PatchResult
    | DescriptionResult
    | ActiveSubscriptionResult
    | SubscribeResult
    | UnsubscribeResult
    | SetMetaDataResult
    | ForceSetMetaDataResult
    | FilterByMetaDataResult
    | DeleteByMetaDataResult
    | OperationResult[]
    | OperationError

export type BatchOperationResult<T extends any[]> = T;
export type AtomicOperationResult<T extends any[]> = Exclude<T[number], Error | OperationError>[]

export type BackendOperationReturnType<T extends BackendOperation> =
    T extends { type: "DELETE" } ? DeleteResult
    : T extends { type: "CREATE" } ? CreateResult
    : T extends { type: "DESCRIPTION" } ? DescriptionResult
    : T extends { type: "FILE" } ? FileResult
    : T extends { type: "WRITE" } ? WriteResult
    : T extends { type: "FORCE_WRITE" } ? ForceWriteResult
    : T extends { type: "PATCH" } ? PatchResult
    : T extends { type: "SET_META_DATA" } ? SetMetaDataResult
    : T extends { type: "FORCE_SET_META_DATA" } ? ForceSetMetaDataResult
    : T extends { type: "UPDATE_META_DATA" } ? UpdateMetaDataResult
    : T extends { type: "FILTER_BY_META_DATA" } ? FilterByMetaDataResult
    : T extends { type: "DELETE_BY_META_DATA" } ? DeleteByMetaDataResult
    : T extends { type: "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE" } ? ActiveSubscriptionResult
    : T extends { type: "SUBSCRIBE_OP" } ? SubscribeResult
    : T extends { type: "UNSUBSCRIBE_OP" } ? UnsubscribeResult
    : T extends { type: "BATCH_OPERATION"; ops: (infer Ops extends BackendOperation)[] }
    ? BatchOperationResult<{ [K in keyof Ops]: BackendOperationReturnType<Extract<Ops[K], BackendOperation>> } & any[]>
    : T extends { type: "ATOMIC_OPERATION"; ops: (infer Ops extends BackendOperation)[] }
    ? AtomicOperationResult<{ [K in keyof Ops]: BackendOperationReturnType<Extract<Ops[K], BackendOperation>> } & any[]>
    : OperationError;
