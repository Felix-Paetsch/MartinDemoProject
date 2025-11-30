import { FileReference, MetaData, RecencyToken, BackendFile } from "./base";
import { BackendOperation } from "./backend_operations";

export type BackendOperationError = string;

export function isBackendOperationError(
    op: GenericBackendOperationResult
): op is BackendOperationError {
    return typeof op == "string";
}

export type BackendFileDataResult = {
    recency_token: RecencyToken;
    meta_data: MetaData;
};

export type BackendCreateResult = BackendOperationError | BackendFileDataResult;
export type BackendFileResult = BackendOperationError | BackendFile;
export type BackendWriteResult = BackendOperationError | BackendFileDataResult;
export type BackendForceWriteResult = BackendWriteResult;
export type BackendDeleteResult =
    | BackendOperationError
    | { fileExisted: boolean };
export type BackendPatchResult = BackendOperationError;
export type BackendDescriptionResult =
    | BackendOperationError
    | BackendFileDataResult;
export type BackendSetMetaDataResult =
    | BackendDescriptionResult
    | BackendOperationError;
export type BackendForceSetMetaDataResult = BackendSetMetaDataResult;
export type BackendFilterByMetaDataResult =
    | BackendFileDataResult[]
    | BackendOperationError;
export type BackendDeleteByMetaDataResult =
    | FileReference[]
    | BackendOperationError;
export type BackendUpdateMetaDataResult = BackendSetMetaDataResult;
export type BackendForceUpdateMetaDataResult = BackendSetMetaDataResult;
export type BackendActiveSubscriptionResult = {
    key: string;
    fr: FileReference;
}[];
export type BackendSubscribeResult =
    | BackendOperationError
    | {
        key: string;
        fr: FileReference;
    };
export type BackendUnsubscribeResult = null;

type BackendAtomicOperationResult<T extends any[]> = Exclude<
    T[number],
    BackendOperationError
>[];

export type BackendOperationResult<T extends BackendOperation> =
    T extends { type: "DELETE" }
    ? BackendDeleteResult
    : T extends { type: "CREATE" }
    ? BackendCreateResult
    : T extends { type: "DESCRIPTION" }
    ? BackendDescriptionResult
    : T extends { type: "FILE" }
    ? BackendFileResult
    : T extends { type: "WRITE" }
    ? BackendWriteResult
    : T extends { type: "FORCE_WRITE" }
    ? BackendForceWriteResult
    : T extends { type: "PATCH" }
    ? BackendPatchResult
    : T extends { type: "SET_META_DATA" }
    ? BackendSetMetaDataResult
    : T extends { type: "FORCE_SET_META_DATA" }
    ? BackendForceSetMetaDataResult
    : T extends { type: "UPDATE_META_DATA" }
    ? BackendUpdateMetaDataResult
    : T extends { type: "FORCE_UPDATE_META_DATA" }
    ? BackendForceUpdateMetaDataResult
    : T extends { type: "FILTER_BY_META_DATA" }
    ? BackendFilterByMetaDataResult
    : T extends { type: "DELETE_BY_META_DATA" }
    ? BackendDeleteByMetaDataResult
    : T extends { type: "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE" }
    ? BackendActiveSubscriptionResult
    : T extends { type: "SUBSCRIBE_OP" }
    ? BackendSubscribeResult
    : T extends { type: "UNSUBSCRIBE_OP" }
    ? BackendUnsubscribeResult
    : T extends { type: "BATCH_OPERATION"; ops: (infer Ops extends BackendOperation)[] }
    ? ({ [K in keyof Ops]: BackendOperationResult<
        Extract<Ops[K], BackendOperation>
    > } & any[])
    : T extends { type: "ATOMIC_OPERATION"; ops: (infer Ops extends BackendOperation)[] }
    ? BackendAtomicOperationResult<
        { [K in keyof Ops]: BackendOperationResult<
            Extract<Ops[K], BackendOperation>
        > } & any[]
    >
    : BackendOperationError;

export type GenericBackendOperationResult =
    | BackendDeleteResult
    | BackendCreateResult
    | BackendDescriptionResult
    | BackendFileResult
    | BackendWriteResult
    | BackendForceWriteResult
    | BackendPatchResult
    | BackendSetMetaDataResult
    | BackendForceSetMetaDataResult
    | BackendUpdateMetaDataResult
    | BackendFilterByMetaDataResult
    | BackendDeleteByMetaDataResult
    | BackendActiveSubscriptionResult
    | BackendSubscribeResult
    | BackendUnsubscribeResult
    | GenericBackendOperationResult[];
