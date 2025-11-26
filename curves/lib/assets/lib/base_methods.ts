import { JsonPatch, PluginEnvironment, uuidv4 } from "pc-messaging-kernel/plugin";
import { LocalMethods } from "../library";
import { active_subscriptions_operation, atomic_operation, create_operation, delete_by_meta_data_operation, delete_file_operation, description_operation, filter_by_meta_data_operation, force_set_meta_data_operation, force_write_operation, read_operation, set_meta_data_operation, subscribe_operation, unsubscribe_operation, update_meta_data_operation } from "../operations";
import { FileContents, FileReference, RecencyToken, SubscriptionCallback } from "../types";
import { ActiveSubscriptionResult, AtomicOperationResult, BatchOperationResult, CreateResult, DeleteByMetaDataResult, DeleteResult, DescriptionResult, FileResult, FilterByMetaDataResult, ForceSetMetaDataResult, ForceWriteResult, OperationError, SetMetaDataResult, SubscribeResult, UnsubscribeResult, UpdateMetaDataResult, WriteResult } from "../operation_result";
import { batch_operation, Operation, write_operation } from "../operations";
import { process_operations_plugin } from "../plugin/process_operation";

const process_operations_any = process_operations_plugin as (env: PluginEnvironment, op: Operation[]) => any;

async function mapAssetError<T>(
    x: Promise<[T] | Error>
): Promise<Exclude<T, Error | OperationError> | Error> {
    const ax = await x;
    if (ax instanceof Error) return ax;
    if (ax[0] instanceof Error) return ax[0];
    if (typeof ax[0] === "string") return new Error(ax[0]);
    return ax[0] as Exclude<T, Error | OperationError>
}

export function create(env: PluginEnvironment, fr: FileReference = uuidv4(), meta_data: { [key: string]: string } = {}, contents: FileContents = "") {
    return mapAssetError<CreateResult>(
        process_operations_any(
            env,
            [create_operation(
                fr,
                meta_data,
                contents
            )]
        )
    )
}

export function delete_file(env: PluginEnvironment, fr: FileReference) {
    return mapAssetError<DeleteResult>(
        process_operations_any(
            env,
            [delete_file_operation(
                fr
            )]
        )
    )
}

export function read_file(env: PluginEnvironment, fr: FileReference) {
    return mapAssetError<FileResult>(
        process_operations_any(
            env,
            [read_operation(
                fr
            )]
        )
    )
}

export function description(env: PluginEnvironment, fr: FileReference) {
    return mapAssetError<DescriptionResult>(
        process_operations_any(
            env,
            [description_operation(
                fr
            )]
        )
    )
}

export function write(env: PluginEnvironment, fr: FileReference, token: RecencyToken, contents: FileContents) {
    return mapAssetError<WriteResult>(
        process_operations_any(
            env,
            [write_operation(
                fr,
                token,
                contents
            )]
        )
    )
}

export function force_write(env: PluginEnvironment, fr: FileReference, contents: FileContents) {
    return mapAssetError<ForceWriteResult>(
        process_operations_any(
            env,
            [force_write_operation(
                fr,
                contents
            )]
        )
    )
}


export function patch(env: PluginEnvironment, fr: FileReference, token: RecencyToken, patches: JsonPatch.Operation[]) {
    return new Error("Unimplemented");
}

export function set_meta_data(env: PluginEnvironment, fr: FileReference, token: RecencyToken, meta_data: { [key: string]: string }) {
    return mapAssetError<SetMetaDataResult>(
        process_operations_any(
            env,
            [set_meta_data_operation(
                fr,
                token,
                meta_data
            )]
        )
    )
}

export function force_set_meta_data(env: PluginEnvironment, fr: FileReference, meta_data: { [key: string]: string }) {
    return mapAssetError<ForceSetMetaDataResult>(
        process_operations_any(
            env,
            [force_set_meta_data_operation(
                fr,
                meta_data
            )]
        )
    )
}

export function update_meta_data(env: PluginEnvironment, fr: FileReference, token: RecencyToken, update_with: { [key: string]: string }) {
    return mapAssetError<UpdateMetaDataResult>(
        process_operations_any(
            env,
            [update_meta_data_operation(
                fr,
                token,
                update_with
            )]
        )
    )
}

export function filter_by_meta_data(env: PluginEnvironment, filter_by: { [key: string]: string }) {
    return mapAssetError<FilterByMetaDataResult>(
        process_operations_any(
            env,
            [filter_by_meta_data_operation(
                filter_by
            )]
        )
    )
}

export function delete_by_meta_data(env: PluginEnvironment, delete_by: { [key: string]: string }) {
    return mapAssetError<DeleteByMetaDataResult>(
        process_operations_any(
            env,
            [delete_by_meta_data_operation(
                delete_by
            )]
        )
    )
}

export async function subscribe(env: PluginEnvironment, to: FileReference, callback: SubscriptionCallback, key: string = uuidv4()) {
    return mapAssetError<SubscribeResult>(
        process_operations_any(
            env,
            [subscribe_operation(
                to,
                callback,
                key
            )]
        )
    )
}

export function unsubscribe(
    env: PluginEnvironment, fr: FileReference, key: string
) {
    return mapAssetError<UnsubscribeResult>(
        process_operations_any(
            env,
            [unsubscribe_operation(
                fr,
                key
            )]
        )
    )
}

export function active_subscriptions(env: PluginEnvironment, fr: FileReference) {
    return mapAssetError<ActiveSubscriptionResult>(
        process_operations_any(
            env,
            [active_subscriptions_operation()]
        )
    )
}

export function atomic<OPS extends Operation[]>(env: PluginEnvironment, operations: OPS) {
    return mapAssetError<AtomicOperationResult<OPS>>(
        process_operations_any(
            env,
            [atomic_operation(operations)]
        )
    )
}

export function batch<OPS extends Operation[]>(env: PluginEnvironment, operations: OPS) {
    return mapAssetError<BatchOperationResult<OPS>>(
        process_operations_any(
            env,
            [batch_operation(operations)]
        )
    )
}
