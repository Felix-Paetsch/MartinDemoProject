import { FrontendOperation } from "./frontend_operations";
import { FileReference, RecencyToken, RegexString } from "./base";
import { JsonPatch, MakeMutable } from "pc-messaging-kernel/utils";

export type BackendOperation =
    {
        type: "DELETE_BY_META_DATA",
        delete_by: { [key: string]: RegexString }
    } | {
        type: "FILTER_BY_META_DATA",
        filter_by: { [key: string]: RegexString }
    } | {
        type: "UPDATE_META_DATA",
        fr: FileReference,
        token: RecencyToken,
        update_with: { [key: string]: string }
    } | {
        type: "FORCE_UPDATE_META_DATA",
        fr: FileReference,
        update_with: { [key: string]: string }
    } | {
        type: "FORCE_SET_META_DATA",
        fr: FileReference,
        meta_data: { [key: string]: string }
    } | {
        type: "SET_META_DATA",
        fr: FileReference,
        token: RecencyToken,
        meta_data: { [key: string]: string }
    } | {
        type: "PATCH",
        fr: FileReference,
        token: RecencyToken,
        patches: JsonPatch.Operation[],
    } | {
        type: "FORCE_WRITE",
        fr: FileReference,
        contents: string
    } | {
        type: "WRITE",
        token: RecencyToken,
        fr: FileReference,
        contents: string
    } | {
        type: "FILE",
        fr: FileReference
    } | {
        type: "DESCRIPTION",
        fr: FileReference
    } | {
        type: "DELETE",
        fr: FileReference
    } | {
        type: "CREATE",
        fr: FileReference,
        contents: string,
        meta_data: { [key: string]: string }
    } | {
        type: "SUBSCRIBE_OP",
        key: string,
        fr: FileReference
    } | {
        type: "UNSUBSCRIBE_OP",
        key: string,
        fr: FileReference
    } | {
        type: "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE"
    } | {
        type: "BATCH_OPERATION",
        ops: BackendOperation[]
    } | {
        type: "ATOMIC_OPERATION",
        ops: BackendOperation[]
    }

export type ToBackendOperation<O extends FrontendOperation> = BackendOperation & {
    type: O["type"]
}

export type SBackendOperation<T extends BackendOperation["type"]> = BackendOperation & { type: T };

export function to_backend_operation<O extends FrontendOperation>(op: FrontendOperation): ToBackendOperation<O> {
    switch (op.type) {
        case "SUBSCRIBE_OP":
            return {
                type: op.type,
                key: op.key,
                fr: op.fr
            }
        case "BATCH_OPERATION":
            return {
                type: "BATCH_OPERATION",
                ops: op.ops.map(o => to_backend_operation(o))
            }
        case "ATOMIC_OPERATION":
            return {
                type: "ATOMIC_OPERATION",
                ops: op.ops.map(o => to_backend_operation(o))
            }
        case "CREATE":
            return {
                type: "CREATE",
                fr: op.fr,
                contents: JSON.stringify(op.contents),
                meta_data: op.meta_data
            }
        case "WRITE":
            return {
                type: "WRITE",
                fr: op.fr,
                contents: JSON.stringify(op.contents),
                token: op.token
            }
        case "FORCE_WRITE":
            return {
                type: "FORCE_WRITE",
                fr: op.fr,
                contents: JSON.stringify(op.contents)
            }
    }

    return op as MakeMutable<typeof op>;
}
