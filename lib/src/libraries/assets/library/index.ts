import { PluginEnvironment, PluginMessagePartner, uuidv4 } from "../../../pluginSystem/plugin_exports"
import { FileReference, File, RecencyToken, FileDescription } from "../types";
import { FileContents } from "../types";
import { mapSuccess, mapSuccessAsync } from "../../../utils/error_handling";
import { JsonPatch } from "../../../utils/json";
import { SubscriptionCallback } from "./subscriptions";
import { perform_operation, perform_operations } from "../protocol/operations";
import { ClientSideOperation } from "../operations";

function get_file(fr: FileReference, from: Awaited<ReturnType<typeof perform_operation>>) {
    return mapSuccess(
        from, (r) => {
            const res = r.fileReferences;
            if (
                !res
                || !res[fr]
                || (typeof res[fr]!.contents === "undefined")
            ) {
                return new Error("Expected file descriptor back");
            }

            return res[fr] as File
        }
    )
}

function get_meta_data(fr: FileReference, from: Awaited<ReturnType<typeof perform_operation>>) {
    return mapSuccess(
        from,
        (r) => {
            const res = r.fileReferences;
            if (
                !res
                || !res[fr]
            ) {
                return new Error("File not found aparently");
            }

            return res[fr].meta_data
        }
    )
}

function get_recency_token(fr: FileReference, from: Awaited<ReturnType<typeof perform_operation>>) {
    return mapSuccess(
        from,
        (r) => {
            const res = r.fileReferences;
            if (
                !res
                || !res[fr]
            ) {
                return new Error("File not found aparently");
            }

            return res[fr].recency_token
        }
    );
}

function get_description(fr: FileReference, from: Awaited<ReturnType<typeof perform_operation>>): FileDescription | Error {
    return mapSuccess(
        from,
        (r) => {
            const res = r.fileReferences;
            if (
                !res
                || !res[fr]
            ) {
                return new Error("File not found aparently");
            }

            return {
                recency_token: res[fr].recency_token,
                meta_data: res[fr].meta_data
            }
        }
    );
}

export function create_operation(fr: FileReference = uuidv4(), meta_data: { [key: string]: string } = {}, contents: FileContents = ""): ClientSideOperation {
    return {
        type: "CREATE",
        fr,
        contents,
        meta_data
    }
}

export function create(env: PluginEnvironment, fr: FileReference = uuidv4(), meta_data: { [key: string]: string } = {}, contents: FileContents = "") {
    return mapSuccessAsync(perform_operation(
        env,
        create_operation(fr, meta_data, contents)
    ), (r) => {
        return get_description(fr, r)
    })
}


export function delete_file_operation(fr: FileReference): ClientSideOperation {
    return {
        type: "DELETE",
        fr
    }
}

export function delete_file(env: PluginEnvironment, fr: FileReference) {
    return mapSuccessAsync(perform_operation(
        env,
        delete_file_operation(fr)
    ), () => { })
}


export function file_operation(fr: FileReference): ClientSideOperation {
    return {
        type: "FILE",
        fr
    }
}
export function file(env: PluginEnvironment, fr: FileReference): Promise<Error | File> {
    return mapSuccessAsync(perform_operation(
        env,
        file_operation(fr)
    ), (r) => {
        return get_file(fr, r);
    })
}

export function description_operation(fr: FileReference): ClientSideOperation {
    return {
        type: "DESCRIPTION",
        fr
    }
}
export function description(env: PluginEnvironment, fr: FileReference) {
    return mapSuccessAsync(perform_operation(
        env,
        description_operation(fr)
    ), (r) => {
        return get_description(fr, r);
    })
}

export function meta_data(env: PluginEnvironment, fr: FileReference) {
    return mapSuccessAsync(description(env, fr), (res) => {
        return res.meta_data
    })
}

export function read_operation(fr: FileReference): ClientSideOperation {
    return {
        type: "FILE",
        fr
    }
}
export function read(env: PluginEnvironment, fr: FileReference) {
    return mapSuccessAsync(perform_operation(
        env,
        read_operation(fr)
    ), (r) => {
        return get_file(fr, r);
    })
}

export function write_operation(fr: FileReference, token: RecencyToken, contents: FileContents): ClientSideOperation {
    return {
        token,
        fr,
        contents,
        type: "WRITE"
    }
}

export function write(env: PluginEnvironment, fr: FileReference, token: RecencyToken, contents: FileContents) {
    return mapSuccessAsync(perform_operation(env, write_operation(
        fr, token, contents
    )), (r) => {
        return get_description(fr, r);
    })
}

export function force_write_operation(fr: FileReference, contents: FileContents): ClientSideOperation {
    return {
        fr,
        contents,
        type: "FORCE_WRITE"
    }
}
export function force_write(env: PluginEnvironment, fr: FileReference, contents: FileContents) {
    return mapSuccessAsync(
        perform_operation(env, force_write_operation(fr, contents)),
        (r) => {
            return get_description(fr, r)
        }
    )
}


export function patch_operation(fr: FileReference, token: RecencyToken, patches: JsonPatch.Operation[]): ClientSideOperation {
    return {
        fr,
        patches,
        token,
        type: "PATCH"
    }
}
export function patch(env: PluginEnvironment, fr: FileReference, token: RecencyToken, patches: JsonPatch.Operation[]) {
    return mapSuccessAsync(perform_operation(env, patch_operation(fr, token, patches)), (r) => {
        return get_description(fr, r);
    })
}

export function set_meta_data_operation(fr: FileReference, token: RecencyToken, meta_data: { [key: string]: string }): ClientSideOperation {
    return {
        fr,
        token,
        type: "SET_META_DATA",
        meta_data
    }
}
export function set_meta_data(env: PluginEnvironment, fr: FileReference, token: RecencyToken, meta_data: { [key: string]: string }) {
    return mapSuccessAsync(perform_operation(env, set_meta_data_operation(fr, token, meta_data)), (r) => {
        return get_description(fr, r);
    });
}


export function force_set_meta_data_operation(fr: FileReference, meta_data: { [key: string]: string }): ClientSideOperation {
    return {
        fr,
        type: "FORCE_SET_META_DATA",
        meta_data
    }
}
export function force_set_meta_data(env: PluginEnvironment, fr: FileReference, meta_data: { [key: string]: string }) {
    return mapSuccessAsync(perform_operation(env, force_set_meta_data_operation(fr, meta_data)), (r) => {
        return get_description(fr, r);
    });
}

export function update_meta_data_operation(fr: FileReference, token: RecencyToken, update_with: { [key: string]: string }): ClientSideOperation {
    return {
        fr,
        token,
        type: "UPDATE_META_DATA",
        update_with
    }
}
export function update_meta_data(env: PluginEnvironment, fr: FileReference, token: RecencyToken, update_with: { [key: string]: string }) {
    return mapSuccessAsync(perform_operation(
        env,
        update_meta_data_operation(fr, token, update_with)
    ), (r) => {
        return get_description(fr, r);
    });
}

export type RegexString = string;
export function filter_by_meta_data_operation(filter_by: { [key: string]: RegexString }): ClientSideOperation {
    return {
        type: "FILTER_BY_META_DATA",
        filter_by
    }
}
export function filter_by_meta_data(env: PluginEnvironment, filter_by: { [key: string]: string }) {
    return mapSuccessAsync(perform_operation(env, filter_by_meta_data_operation(filter_by)), (res) => {
        return res.fileReferenceArrays[0] || new Error("Unexpected response");
    });
}

export function delete_by_meta_data_operation(delete_by: { [key: string]: string }): ClientSideOperation {
    return {
        type: "DELETE_BY_META_DATA",
        delete_by
    }
}
export function delete_by_meta_data(env: PluginEnvironment, delete_by: { [key: string]: string }) {
    return mapSuccessAsync(perform_operation(env, delete_by_meta_data_operation(delete_by)), (res) => {
        return res.fileReferenceArrays[0] || new Error("Unexpected response");
    });
}

export function subscribe_operation(to: FileReference, callback: SubscriptionCallback, key: string = uuidv4()): ClientSideOperation {
    return {
        type: "SUBSCRIBE_CB",
        fr: to,
        key,
        cb: callback
    }
}
export async function subscribe(env: PluginEnvironment, to: FileReference, callback: SubscriptionCallback, key: string = uuidv4()) {
    return await mapSuccessAsync(perform_operation(env, subscribe_operation(to, callback, key)), () => {
        return key;
    })
}

export function unsubscribe_operation(fr: FileReference, key: string): ClientSideOperation {
    return {
        type: "UNSUBSCRIBE_CB",
        key,
        fr
    }
}
export function unsubscribe(
    env: PluginEnvironment, fr: FileReference, key: string
) {
    return mapSuccessAsync(
        perform_operation(env, unsubscribe_operation(fr, key)),
        () => { }
    );
}

export function active_subscriptions_operation(fr: FileReference): ClientSideOperation {
    return {
        type: "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE",
        fr: fr
    }
}
export function active_subscriptions(env: PluginEnvironment, fr: FileReference): Promise<Error | string[]> {
    return mapSuccessAsync(
        perform_operation(env, active_subscriptions_operation(fr)),
        (r) => {
            return r;
        }
    ) as Promise<Error | string[]>
}

export function atomic_operation(env: PluginEnvironment, operations: ClientSideOperation[]) {
    return perform_operations(env, operations, "Atomic")
}

export function bundled_operation(env: PluginEnvironment, operations: ClientSideOperation[]) {
    return perform_operations(env, operations, "Bundled")
}
