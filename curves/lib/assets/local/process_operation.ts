import { Address } from "pc-messaging-kernel/messaging";
import { BackendOperation, SBackendOperation } from "../plugin/process_operation";
import { File, FileReference } from "../types";
import { Store } from "./state";
import { uuidv4 } from "pc-messaging-kernel/plugin";
import {
    BackendOperationReturnType,
    CreateResult,
    DeleteByMetaDataResult,
    DeleteResult,
    DescriptionResult,
    FileResult,
    FilterByMetaDataResult,
    ForceSetMetaDataResult,
    ForceWriteResult,
    SetMetaDataResult,
    UpdateMetaDataResult,
    WriteResult,
} from "../operation_result";
import { is_system_file } from "./system_files";
import { is_settable_meta_data } from "./files";
import { change_file_event, change_meta_data_event, delete_file_event, handleGetActiveSubscriptionsOperation, handleSubscriptionOperation, handleUnsubscripeOperation, trigger_file_events } from "./subscriptions";

type commulativeOperation = BackendOperation & {
    type: "BATCH_OPERATION" | "ATOMIC_OPERATION";
};

function handleAtomicOperation() {
    return "Unimplemented atomic operation";
}

function handleFileOperation(op: SBackendOperation<"FILE">): FileResult {
    const file = Store[op.fr];
    if (!file) return `File ${op.fr} not found.`
    return JSON.parse(JSON.stringify(file));
}

function handleCreateOperation(op: SBackendOperation<"CREATE">): CreateResult {
    const existing = Store[op.fr];
    if (existing) return `File ${op.fr} already exists.`;
    const entry: File = {
        meta_data: {
            fileReference: op.fr,
            fileType: "LOCAL",
            ...op.meta_data,
        },
        contents: op.contents,
        recency_token: uuidv4(),
    };
    Store[op.fr] = entry;
    return {
        recency_token: entry.recency_token,
        meta_data: entry.meta_data,
    } as const;
}

function handleWriteOperation(op: SBackendOperation<"WRITE">): WriteResult {
    const file = Store[op.fr];
    if (!file) return `File ${op.fr} doesnt exists.`;
    if (file.recency_token !== op.token) {
        console.log(file.recency_token, op.token);
        return `Recency token for file ${op.fr} in WRITE operation outdated.`;
    }
    file.contents = op.contents;
    file.recency_token = uuidv4();
    trigger_file_events(change_file_event(file.meta_data.fileReference));
    return {
        recency_token: file.recency_token,
        meta_data: file.meta_data,
    } as const;
}

function handleForceWriteOperation(op: SBackendOperation<"FORCE_WRITE">): ForceWriteResult {
    const file = Store[op.fr];
    if (!file) return `File ${op.fr} doesnt exists.`;
    file.contents = op.contents;
    file.recency_token = uuidv4();
    trigger_file_events(change_file_event(file.meta_data.fileReference));
    return {
        recency_token: file.recency_token,
        meta_data: file.meta_data,
    } as const;
}

function handleDeleteOperation(op: SBackendOperation<"DELETE">): DeleteResult {
    const file = Store[op.fr];
    if (!file) return { fileExisted: false };
    if (file.meta_data.fileType !== "LOCAL") {
        return `File ${file.meta_data.fileReference} currently cant be deleted.`;
    }
    trigger_file_events(delete_file_event(file.meta_data.fileReference));
    delete Store[op.fr];
    return { fileExisted: true };
}

function handlePatchOperation(op: SBackendOperation<"PATCH">) {
    return new Error("Currently unimplemented");
}

function handleDescriptionOperation(op: SBackendOperation<"DESCRIPTION">): DescriptionResult {
    const file = Store[op.fr];
    if (!file) return `File ${op.fr} not found.`;
    return {
        recency_token: file.recency_token,
        meta_data: file.meta_data,
    } as const;
}

function handleSetMetaDataOperation(op: SBackendOperation<"SET_META_DATA">): SetMetaDataResult {
    const file = Store[op.fr];
    if (!file) return `File ${op.fr} not found.`;
    if (file.recency_token !== op.token)
        return `File recency token outdated.`;
    if (is_system_file(file.meta_data.fileReference)) {
        return `Can't write to system file ${op.fr}`;
    }

    if (
        !is_settable_meta_data(op.meta_data) ||
        op.meta_data.fileReference !== file.meta_data.fileReference
    ) {
        return "Tried to set invalid meta data";
    }

    trigger_file_events(change_meta_data_event(file.meta_data.fileReference));
    file.meta_data = op.meta_data;
    file.recency_token = "" + performance.now();
    return {
        recency_token: file.recency_token,
        meta_data: file.meta_data,
    } as const;
}

function handleForceSetMetaDataOperation(
    op: SBackendOperation<"FORCE_SET_META_DATA">
): ForceSetMetaDataResult | string {
    const file = Store[op.fr];
    if (!file) return `File ${op.fr} not found.`;
    if (is_system_file(file.meta_data.fileReference)) {
        return `Can't write to system file ${op.fr}`;
    }

    if (
        !is_settable_meta_data(op.meta_data) ||
        op.meta_data.fileReference !== file.meta_data.fileReference
    ) {
        return "Tried to set invalid meta data";
    }

    trigger_file_events(change_meta_data_event(file.meta_data.fileReference));
    file.meta_data = op.meta_data;
    file.recency_token = "" + performance.now();
    return {
        recency_token: file.recency_token,
        meta_data: file.meta_data,
    } as const;
}

function handleUpdateMetaDataOperation(
    op: SBackendOperation<"UPDATE_META_DATA">
): UpdateMetaDataResult | string {
    const file = Store[op.fr];
    if (!file) return `File ${op.fr} not found.`;
    if (is_system_file(file.meta_data.fileReference)) {
        return `Can't write to system file ${op.fr}`;
    }

    const md = {
        ...file.meta_data,
        ...op.update_with
    };

    if (
        !is_settable_meta_data(md) ||
        md.fileReference !== file.meta_data.fileReference
    ) {
        return "Tried to set invalid meta data";
    }

    trigger_file_events(change_meta_data_event(file.meta_data.fileReference));
    file.meta_data = md;
    file.recency_token = "" + performance.now();
    return {
        recency_token: file.recency_token,
        meta_data: file.meta_data,
    } as const;
}

function handleFilterByMetaDataOperation(
    op: SBackendOperation<"FILTER_BY_META_DATA">
): FilterByMetaDataResult {
    const regex: [string, RegExp][] = [];
    try {
        Object.keys(op.filter_by).forEach((k: string) => {
            regex.push([k, new RegExp(op.filter_by[k]!)])
        })
    } catch (e: any) {
        return `Invalid RegExp: ${e.message!}`;
    }

    return Object.values(Store).filter(f => {
        for (const [key, reg] of regex) {
            if (typeof f.meta_data[key] === "undefined" || !reg.test(f.meta_data[key])) {
                return false;
            }
        }
        return true;
    })
}

function handleDeleteByMetaDataOperation(
    op: SBackendOperation<"DELETE_BY_META_DATA">
): DeleteByMetaDataResult {
    const regex: [string, RegExp][] = [];
    try {
        Object.keys(op.delete_by).forEach((k: string) => {
            regex.push([k, new RegExp(op.delete_by[k]!)])
        })
    } catch (e: any) {
        return `Invalid RegExp: ${e.message!}`;
    }

    const res: FileReference[] = [];
    for (let f of Object.values(Store)) {
        for (const [key, reg] of regex) {
            if (typeof f.meta_data[key] === "undefined" || !reg.test(f.meta_data[key])) {
                continue;
            }
        }
        res.push(f.meta_data.fileReference);
        delete Store[f.meta_data.fileReference];

        trigger_file_events(delete_file_event(f.meta_data.fileReference));
    }
    return res;
} // ---- MAIN OPERATION FUNCTION ----

export function _perform_operation(
    address: Address,
    op: BackendOperation
): BackendOperationReturnType<
    Exclude<BackendOperation, commulativeOperation>
> | Error {
    switch (op.type) {
        case "BATCH_OPERATION":
            return op.ops.map((p: BackendOperation) => {
                const r = _perform_operation(address, p);
                if (r instanceof Error) {
                    return r.name;
                }
                return r as any;
            });
        case "ATOMIC_OPERATION":
            return handleAtomicOperation();
        case "FILE":
            return handleFileOperation(op);
        case "CREATE":
            return handleCreateOperation(op);
        case "WRITE":
            return handleWriteOperation(op);
        case "FORCE_WRITE":
            return handleForceWriteOperation(op);
        case "DELETE":
            return handleDeleteOperation(op);
        case "PATCH":
            return handlePatchOperation(op);
        case "DESCRIPTION":
            return handleDescriptionOperation(op);
        case "SET_META_DATA":
            return handleSetMetaDataOperation(op);
        case "FORCE_SET_META_DATA":
            return handleForceSetMetaDataOperation(op);
        case "UPDATE_META_DATA":
            return handleUpdateMetaDataOperation(op);
        case "FILTER_BY_META_DATA":
            return handleFilterByMetaDataOperation(op);
        case "DELETE_BY_META_DATA":
            return handleDeleteByMetaDataOperation(op);
        case "SUBSCRIBE_OP":
            return handleSubscriptionOperation(op, address);
        case "UNSUBSCRIBE_OP":
            return handleUnsubscripeOperation(op, address);
        case "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE":
            return handleGetActiveSubscriptionsOperation(op, address);
    }

    return `Invalid Operation: ${JSON.stringify(op)}`
}

export function perform_operation<O extends BackendOperation>(
    addr: Address,
    op: O
): BackendOperationReturnType<O> | Error {
    const res = _perform_operation(addr, op) as any;
    return res;
}
