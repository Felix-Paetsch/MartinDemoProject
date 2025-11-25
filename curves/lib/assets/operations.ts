import { JsonPatch, mapSuccessAsync } from "pc-messaging-kernel/utils";
import { SubscriptionCallback, FileContents, FileReference, RecencyToken } from "./types";
import { uuidv4 } from "pc-messaging-kernel/plugin";

export function create_operation(fr: FileReference = uuidv4(), meta_data: { [key: string]: string } = {}, contents: FileContents = "") {
    return {
        type: "CREATE",
        fr,
        contents,
        meta_data
    } as const;
}

export function delete_file_operation(fr: FileReference) {
    return {
        type: "DELETE",
        fr
    } as const;
}

export function description_operation(fr: FileReference) {
    return {
        type: "DESCRIPTION",
        fr
    } as const;
}

export function read_operation(fr: FileReference) {
    return {
        type: "FILE",
        fr
    } as const
}

export function write_operation(fr: FileReference, token: RecencyToken, contents: FileContents) {
    return {
        token,
        fr,
        contents,
        type: "WRITE"
    } as const
}

export function force_write_operation(fr: FileReference, contents: FileContents) {
    return {
        fr,
        contents,
        type: "FORCE_WRITE"
    } as const;
}

export function patch_operation(fr: FileReference, token: RecencyToken, patches: JsonPatch.Operation[]) {
    const r: {
        fr: FileReference,
        patches: JsonPatch.Operation[],
        token: RecencyToken,
        type: "PATCH"
    } = {
        fr,
        patches,
        token,
        type: "PATCH"
    };
    return r;
}

export function set_meta_data_operation(fr: FileReference, token: RecencyToken, meta_data: { [key: string]: string }) {
    return {
        fr,
        token,
        type: "SET_META_DATA",
        meta_data
    } as const
}

export function force_set_meta_data_operation(fr: FileReference, meta_data: { [key: string]: string }) {
    return {
        fr,
        type: "FORCE_SET_META_DATA",
        meta_data
    } as const;
}

export function update_meta_data_operation(fr: FileReference, token: RecencyToken, update_with: { [key: string]: string }) {
    return {
        fr,
        token,
        type: "UPDATE_META_DATA",
        update_with
    } as const;
}

export type RegexString = string;
export function filter_by_meta_data_operation(filter_by: { [key: string]: RegexString }) {
    return {
        type: "FILTER_BY_META_DATA",
        filter_by
    } as const;
}

export function delete_by_meta_data_operation(delete_by: { [key: string]: string }) {
    return {
        type: "DELETE_BY_META_DATA",
        delete_by
    } as const;
}

export function subscribe_operation(to: FileReference, callback: SubscriptionCallback, key: string = uuidv4()) {
    return {
        type: "SUBSCRIBE_OP",
        fr: to,
        key,
        cb: callback
    } as const
}

export function unsubscribe_operation(fr: FileReference, key: string) {
    return {
        type: "UNSUBSCRIBE_OP",
        key,
        fr
    } as const;
}

export function active_subscriptions_operation(fr: FileReference) {
    return {
        type: "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE",
        fr: fr
    } as const;
}

type Operation =
    | ReturnType<typeof create_operation>
    | ReturnType<typeof delete_file_operation>
    | ReturnType<typeof description_operation>
    | ReturnType<typeof read_operation>
    | ReturnType<typeof write_operation>
    | ReturnType<typeof force_write_operation>
    | ReturnType<typeof patch_operation>
    | ReturnType<typeof set_meta_data_operation>
    | ReturnType<typeof force_set_meta_data_operation>
    | ReturnType<typeof update_meta_data_operation>
    | ReturnType<typeof filter_by_meta_data_operation>
    | ReturnType<typeof delete_by_meta_data_operation>
    | ReturnType<typeof subscribe_operation>
    | ReturnType<typeof unsubscribe_operation>
    | ReturnType<typeof active_subscriptions_operation>
    | {
        type: "ATOMIC_OPERATION",
        ops: Operation[]
    } | {
        type: "BATCH_OPERATION",
        ops: Operation[]
    }

export function atomic_operation(ops: Operation[]): Operation {
    return {
        type: "ATOMIC_OPERATION",
        ops
    } as const;
}

export function batch_operation(ops: Operation[]): Operation {
    return {
        type: "BATCH_OPERATION",
        ops
    } as const;
}
