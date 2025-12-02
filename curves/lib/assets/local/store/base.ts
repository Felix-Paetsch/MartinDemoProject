import { SBackendOperation } from "../../types/backend_operations";
import {
    BackendDeleteResult,
    BackendFilterByMetaDataResult,
    BackendDescriptionResult,
    BackendForceSetMetaDataResult,
    BackendForceUpdateMetaDataResult,
    BackendSetMetaDataResult,
    BackendForceWriteResult,
    BackendCreateResult,
    BackendFileResult,
    BackendPatchResult,
    BackendUpdateMetaDataResult,
    BackendDeleteByMetaDataResult,
    BackendWriteResult,
    BackendSubscribeResult,
    BackendActiveSubscriptionResult,
    BackendUnsubscribeResult,
} from "../../types/backend_result";
import { FileReference, RecencyToken } from "../../types/base";
import { Address } from "pc-messaging-kernel/messaging";

export abstract class AssetStore {
    constructor() { }

    abstract get_file(op: SBackendOperation<"FILE">): BackendFileResult;

    abstract create_file(
        op: SBackendOperation<"CREATE">,
        RT?: RecencyToken
    ): BackendCreateResult;

    abstract write(
        op: SBackendOperation<"WRITE">,
        RT?: RecencyToken
    ): BackendWriteResult;

    abstract force_write(
        op: SBackendOperation<"FORCE_WRITE">,
        RT?: RecencyToken
    ): BackendForceWriteResult;

    abstract delete(op: SBackendOperation<"DELETE">): BackendDeleteResult;

    abstract patch(op: SBackendOperation<"PATCH">): BackendPatchResult;

    abstract description(
        op: SBackendOperation<"DESCRIPTION">
    ): BackendDescriptionResult;

    abstract set_meta_data(
        op: SBackendOperation<"SET_META_DATA">,
        RT?: RecencyToken
    ): BackendSetMetaDataResult;

    abstract force_set_meta_data(
        op: SBackendOperation<"FORCE_SET_META_DATA">,
        RT?: RecencyToken
    ): BackendForceSetMetaDataResult;

    abstract force_update_meta_data(
        op: SBackendOperation<"FORCE_UPDATE_META_DATA">,
        RT?: RecencyToken
    ): BackendForceUpdateMetaDataResult;

    abstract update_meta_data(
        op: SBackendOperation<"UPDATE_META_DATA">,
        RT?: RecencyToken
    ): BackendUpdateMetaDataResult;

    abstract filter_by_meta_data(
        op: SBackendOperation<"FILTER_BY_META_DATA">
    ): BackendFilterByMetaDataResult;

    abstract delete_by_meta_data(
        op: SBackendOperation<"DELETE_BY_META_DATA">
    ): BackendDeleteByMetaDataResult;

    abstract subscribe(
        addr: Address,
        op: SBackendOperation<"SUBSCRIBE_OP">
    ): BackendSubscribeResult;
    abstract unsubscribe(
        addr: Address,
        op: SBackendOperation<"UNSUBSCRIBE_OP">
    ): BackendUnsubscribeResult;
    abstract get_active_subscriptions(
        addr: Address,
        op: SBackendOperation<"GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE">
    ): BackendActiveSubscriptionResult;

    has_file(fr: FileReference) {
        return (
            typeof this.description({
                type: "DESCRIPTION",
                fr,
            }) !== "string"
        );
    }
}
