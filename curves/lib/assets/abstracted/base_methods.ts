import { active_subscriptions_operation, atomic_operation, create_operation, delete_by_meta_data_operation, delete_file_operation, description_operation, filter_by_meta_data_operation, force_set_meta_data_operation, force_write_operation, read_operation, set_meta_data_operation, SFrontendOperation, subscribe_operation, unsubscribe_operation, update_meta_data_operation } from "../types/frontend_operations";
import { FileContents, FileReference, RecencyToken } from "../types/base";
import { batch_operation, FrontendOperation, write_operation } from "../types/frontend_operations";
import { process_operations_plugin } from "../plugin/process_operation";
import { FrontendOperationResult } from "../types/frontend_result";
import { SubscriptionCallback } from "../types/frontend_file_events";
import { JsonPatch, uuidv4 } from "pc-messaging-kernel/utils";
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";

async function perform_base_operation<O extends FrontendOperation>(env: PluginEnvironment, o: O): Promise<FrontendOperationResult<O> | Error> {
    const r = await process_operations_plugin(
        env,
        [o]
    );

    if (r instanceof Error) return r;
    const s = r[0]!;
    if (s instanceof Error) return s;
    return s as FrontendOperationResult<O>;
}

export function create(env: PluginEnvironment, fr: FileReference = uuidv4(), meta_data: { [key: string]: string } = {}, contents: FileContents = "") {
    return perform_base_operation(
        env,
        create_operation(fr, meta_data, contents)
    )
}

export function delete_file(env: PluginEnvironment, fr: FileReference) {
    return perform_base_operation(
        env,
        delete_file_operation(
            fr
        )
    )
}

export function read_file(env: PluginEnvironment, fr: FileReference) {
    return perform_base_operation(
        env,
        read_operation(
            fr
        )

    )
}

export function description(env: PluginEnvironment, fr: FileReference) {
    return perform_base_operation(
        env,
        description_operation(fr)
    )
}

export function write(env: PluginEnvironment, fr: FileReference, token: RecencyToken, contents: FileContents) {
    return perform_base_operation(
        env,
        write_operation(
            fr,
            token,
            contents
        )
    )
}

export function force_write(env: PluginEnvironment, fr: FileReference, contents: FileContents) {
    return perform_base_operation(
        env,
        force_write_operation(
            fr,
            contents
        )
    )
}


export function patch(env: PluginEnvironment, fr: FileReference, token: RecencyToken, patches: JsonPatch.Operation[]) {
    return new Error("Unimplemented");
}

export function set_meta_data(env: PluginEnvironment, fr: FileReference, token: RecencyToken, meta_data: { [key: string]: string }) {
    return perform_base_operation(
        env,
        set_meta_data_operation(
            fr,
            token,
            meta_data
        )
    )
}

export function force_set_meta_data(env: PluginEnvironment, fr: FileReference, meta_data: { [key: string]: string }) {
    return perform_base_operation(
        env,
        force_set_meta_data_operation(
            fr,
            meta_data
        )
    )
}

export function update_meta_data(env: PluginEnvironment, fr: FileReference, token: RecencyToken, update_with: { [key: string]: string }) {
    return perform_base_operation(
        env,
        update_meta_data_operation(
            fr,
            token,
            update_with
        )
    )
}

export function filter_by_meta_data(env: PluginEnvironment, filter_by: { [key: string]: string }) {
    return perform_base_operation(
        env,
        filter_by_meta_data_operation(
            filter_by
        )
    )
}

export function delete_by_meta_data(env: PluginEnvironment, delete_by: { [key: string]: string }) {
    return perform_base_operation(
        env,
        delete_by_meta_data_operation(
            delete_by
        )
    )
}

export async function subscribe(env: PluginEnvironment, to: FileReference, callback: SubscriptionCallback, key: string = uuidv4()) {
    return perform_base_operation(
        env,
        subscribe_operation(
            to,
            callback,
            key
        )
    )
}

export function unsubscribe(
    env: PluginEnvironment, fr: FileReference, key: string
) {
    return perform_base_operation(
        env,
        unsubscribe_operation(
            fr,
            key
        )
    )
}

export function active_subscriptions(env: PluginEnvironment) {
    return perform_base_operation(
        env,
        active_subscriptions_operation()
    )
}


export function atomic<OPS extends FrontendOperation[]>(env: PluginEnvironment, operations: OPS) {
    return perform_base_operation(
        env,
        atomic_operation(operations)
    ) as Promise<
        FrontendOperationResult<
            SFrontendOperation<"ATOMIC_OPERATION"> & { ops: OPS }
        >
    >
}

export function batch<OPS extends FrontendOperation[]>(env: PluginEnvironment, operations: OPS) {
    return perform_base_operation(
        env,
        batch_operation(operations)
    ) as Promise<
        FrontendOperationResult<
            SFrontendOperation<"ATOMIC_OPERATION"> & { ops: OPS }
        >
    >
}
