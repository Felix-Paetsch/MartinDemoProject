import { FileReference, MetaData, RecencyToken, File } from "./base";
import { FrontendOperation } from "./frontend_operations";

export type FrontendOperationError = Error;
export function isFrontendOperationError(
    op: GenericFrontendOperationResult
): op is FrontendOperationError {
    return op instanceof Error;
}

export type FrontendFileDataResult = {
    recency_token: RecencyToken;
    meta_data: MetaData;
};

export type FrontendCreateResult = FrontendOperationError | FrontendFileDataResult;
export type FrontendFileResult = FrontendOperationError | File;
export type FrontendWriteResult = FrontendOperationError | FrontendFileDataResult;
export type FrontendForceWriteResult = FrontendWriteResult;
export type FrontendDeleteResult =
    | FrontendOperationError
    | { fileExisted: boolean };
export type FrontendPatchResult = FrontendOperationError;
export type FrontendDescriptionResult =
    | FrontendOperationError
    | FrontendFileDataResult;
export type FrontendSetMetaDataResult =
    | FrontendDescriptionResult
    | FrontendOperationError;
export type FrontendForceSetMetaDataResult = FrontendSetMetaDataResult;
export type FrontendFilterByMetaDataResult =
    | FrontendFileDataResult[]
    | FrontendOperationError;
export type FrontendDeleteByMetaDataResult =
    | FileReference[]
    | FrontendOperationError;
export type FrontendUpdateMetaDataResult = FrontendSetMetaDataResult;
export type FrontendForceUpdateMetaDataResult = FrontendSetMetaDataResult;
export type FrontendActiveSubscriptionResult = {
    key: string;
    fr: FileReference;
}[];
export type FrontendSubscribeResult =
    | FrontendOperationError
    | {
        key: string;
        fr: FileReference;
    };
export type FrontendUnsubscribeResult = null;

type FrontendAtomicOperationResult<T extends any[]> = Exclude<
    T[number],
    FrontendOperationError
>[];

export type FrontendOperationResult<T extends FrontendOperation> =
    (
        T extends { type: "DELETE" }
        ? FrontendDeleteResult
        : T extends { type: "CREATE" }
        ? FrontendCreateResult
        : T extends { type: "DESCRIPTION" }
        ? FrontendDescriptionResult
        : T extends { type: "FILE" }
        ? FrontendFileResult
        : T extends { type: "WRITE" }
        ? FrontendWriteResult
        : T extends { type: "FORCE_WRITE" }
        ? FrontendForceWriteResult
        : T extends { type: "PATCH" }
        ? FrontendPatchResult
        : T extends { type: "SET_META_DATA" }
        ? FrontendSetMetaDataResult
        : T extends { type: "FORCE_SET_META_DATA" }
        ? FrontendForceSetMetaDataResult
        : T extends { type: "UPDATE_META_DATA" }
        ? FrontendUpdateMetaDataResult
        : T extends { type: "FORCE_UPDATE_META_DATA" }
        ? FrontendForceUpdateMetaDataResult
        : T extends { type: "FILTER_BY_META_DATA" }
        ? FrontendFilterByMetaDataResult
        : T extends { type: "DELETE_BY_META_DATA" }
        ? FrontendDeleteByMetaDataResult
        : T extends { type: "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE" }
        ? FrontendActiveSubscriptionResult
        : T extends { type: "SUBSCRIBE_OP" }
        ? FrontendSubscribeResult
        : T extends { type: "UNSUBSCRIBE_OP" }
        ? FrontendUnsubscribeResult
        : T extends { type: "BATCH_OPERATION"; ops: (infer Ops extends FrontendOperation)[] }
        ? ({ [K in keyof Ops]: FrontendOperationResult<
            Extract<Ops[K], FrontendOperation>
        > } & any[])
        : T extends { type: "ATOMIC_OPERATION"; ops: (infer Ops extends FrontendOperation)[] }
        ? FrontendAtomicOperationResult<
            { [K in keyof Ops]: FrontendOperationResult<
                Extract<Ops[K], FrontendOperation>
            > } & any[]
        >
        : FrontendOperationError
    ) | FrontendOperationError;

export type GenericFrontendOperationResult =
    | FrontendDeleteResult
    | FrontendCreateResult
    | FrontendDescriptionResult
    | FrontendFileResult
    | FrontendWriteResult
    | FrontendForceWriteResult
    | FrontendPatchResult
    | FrontendSetMetaDataResult
    | FrontendForceSetMetaDataResult
    | FrontendUpdateMetaDataResult
    | FrontendFilterByMetaDataResult
    | FrontendDeleteByMetaDataResult
    | FrontendActiveSubscriptionResult
    | FrontendSubscribeResult
    | FrontendUnsubscribeResult
    | GenericFrontendOperationResult[];
