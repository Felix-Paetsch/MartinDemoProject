// Long term we need to think abt async stuff and so on..
// And timeouts... bla... on the other hand: responsiveness

import { Address } from "../../../messaging/exports";
import { JsonPatch } from "../../../utils/json-patch";
import { ProtocolResponse } from "../protocol/main";
import { AssetSideBaseOperation } from "../protocol/operations";
import { File, FileContents, FileEvent, FileReference, MetaData, RecencyToken } from "../types";
import {
    filter_by_meta_data,
    set_file_response,
    set_description_response
} from "./helper";
import { is_settable_meta_data, userFileTypes } from "./meta_data";
import { active_subscriptions, SubscriptionEvent, trigger_events } from "./plugin";

export const fileStore: File[] = [];

const operationOrder = [
    "FILE",
    "DESCRIPTION",
    "FILTER_BY_META_DATA",
    "SUBSCRIBE",
    "UNSUBSCRIBE",
    "CREATE",
    "DELETE",
    "FORCE_WRITE",
    "WRITE",
    "PATCH",
    "SET_META_DATA",
    "FORCE_SET_META_DATA",
    "UPDATE_META_DATA",
    "DELETE_BY_META_DATA",
    "GET_ACTIVE_FILE_REFERENCES"
] as const;

export type OperationProcessingResult = {
    fileReferences: {
        [key: FileReference]: {
            meta_data: MetaData,
            recency_token: RecencyToken,
            contents?: FileContents
        }
    },
    fileReferenceArrays: FileReference[][],
    errors: Error[] // Only needed when bundled and not atomic
};

type OperationProcessor<O extends AssetSideBaseOperation> = (op: O, res: OperationProcessingResult, partner: Address.StringSerializedAddress) => Error | {
    undo?: () => void,
    events?: (FileEvent | SubscriptionEvent)[]
} | void;

const Processors: {
    [Key in typeof operationOrder[number]]: OperationProcessor<AssetSideBaseOperation & { type: Key }>
} = {
    "FILE": (op, res) => {
        return set_file_response(res, op.fr);
    },
    "DESCRIPTION": (op, res) => {
        return set_description_response(res, op.fr);
    },
    "FILTER_BY_META_DATA": (op, res) => {
        const files = filter_by_meta_data(op.filter_by);
        if (files instanceof Error) return files;

        const ref = files.map(f => {
            set_description_response(res, f.meta_data.fileReference);
            return f.meta_data.fileReference
        });
        res.fileReferenceArrays.push(ref);
    },
    "SUBSCRIBE": (op, _, partner) => {
        if (!fileStore.some(f => f.meta_data.fileReference == op.fr)) {
            return new Error("File reference doesnt't exist!");
        }
        return {
            events: [{
                type: "SUBSCRIBE",
                partner,
                fr: op.fr
            }]
        }
    },
    "UNSUBSCRIBE": (op, _, partner) => {
        return {
            events: [{
                type: "UNSUBSCRIBE",
                partner,
                fr: op.fr
            }]
        }
    },
    "CREATE": (op, res) => {
        if (fileStore.some(f => f.meta_data.fileReference === op.fr)) {
            return new Error(`File ${op.fr} already exists.`);
        }
        const meta_data = {
            fileReference: op.fr,
            fileType: "LOCAL",
            ...op.meta_data
        };

        if (!is_settable_meta_data(meta_data)) {
            return new Error("Invalid meta Data supplied");
        }

        const file: File = {
            recency_token: performance.now(),
            meta_data: {
                fileReference: op.fr,
                fileType: "LOCAL",
                ...op.meta_data
            },
            contents: op.contents
        }

        fileStore.push(file);
        set_description_response(res, file.meta_data.fileReference)

        return {
            undo: () => {
                const fileIndex = fileStore.findIndex(
                    f => f.meta_data.fileReference === file.meta_data.fileReference
                );
                if (fileIndex > -1) {
                    fileStore.splice(fileIndex, 1);
                }
            }
        }
    },
    "DELETE": (op) => {
        const fileIndex = fileStore.findIndex(f => f.meta_data.fileReference === op.fr);
        if (
            fileIndex < 0
            || !userFileTypes.includes(fileStore[fileIndex]!.meta_data.fileType)
        ) {
            return new Error(`File ${op.fr} not found.`);
        }
        const file = fileStore.splice(fileIndex, 1)[0]!;
        return {
            undo: () => {
                fileStore.push(file);
            },
            events: [{
                type: "DELETE",
                recency_token: performance.now(),
                file_reference: op.fr
            }]
        }
    },
    "DELETE_BY_META_DATA": (op, res) => {
        const filtered = filter_by_meta_data(op.delete_by)
        if (filtered instanceof Error) return filtered;

        const files = filtered.filter(f => {
            return ["LOCAL", "PERSISTED"].includes(f.meta_data.fileType)
        });

        for (let i = fileStore.length - 1; i >= 0; i--) {
            if (files.includes(fileStore[i]!)) {
                fileStore.splice(i, 1);
            }
        }

        res.fileReferenceArrays.push(
            files.map(f => f.meta_data.fileReference)
        )

        return {
            undo: () => {
                fileStore.push(...files);
            },
            events: files.map(f => ({
                "type": "DELETE",
                "recency_token": performance.now(),
                file_reference: f.meta_data.fileReference
            }))
        }
    },
    "WRITE": (op, res) => {
        const file = fileStore.find(f => f.meta_data.fileReference === op.fr);
        if (!file) return new Error(`File ${op.fr} not found.`);
        if (file.recency_token !== op.token) return new Error(`File recency token outdated.`);

        const oldContents = file.contents;
        const oldToken = file.recency_token;
        (file as any).contents = op.contents;
        (file as any).recency_token = performance.now();
        set_description_response(res, file.meta_data.fileReference);
        return {
            undo: () => {
                (file as any).recency_token = oldToken;
                (file as any).contents = oldContents;
            },
            events: [{
                "type": "CHANGE_FILE_CONTENT",
                ...file,
                file_reference: file.meta_data.fileReference
            }]
        }
    },
    "FORCE_WRITE": (op, res) => {
        const file = fileStore.find(f => f.meta_data.fileReference === op.fr);
        if (!file) return new Error(`File ${op.fr} not found.`);

        const oldContents = file.contents;
        const oldToken = file.recency_token;
        (file as any).contents = op.contents;
        (file as any).recency_token = performance.now();
        set_description_response(res, file.meta_data.fileReference);
        return {
            undo: () => {
                (file as any).recency_token = oldToken;
                (file as any).contents = oldContents;
            },
            events: [{
                "type": "CHANGE_FILE_CONTENT",
                ...file,
                file_reference: file.meta_data.fileReference
            }]
        }
    },
    "SET_META_DATA": (op, res) => {
        const file = fileStore.find(f => f.meta_data.fileReference === op.fr);
        if (!file) return new Error(`File ${op.fr} not found.`);
        if (file.recency_token !== op.token) return new Error(`File recency token outdated.`);

        if (
            !is_settable_meta_data(op.meta_data)
            || op.meta_data.fileReference !== file.meta_data.fileReference
        ) {
            return new Error("Tried to set invalid meta data");
        }

        const oldMetaData = file.meta_data;
        const oldToken = file.recency_token;
        (file as any).meta_data = op.meta_data;
        (file as any).recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                (file as any).recency_token = oldToken;
                (file as any).meta_data = oldMetaData;
            },
            events: [{
                type: "CHANGE_META_DATA",
                ...file,
                file_reference: file.meta_data.fileReference
            }]
        }
    },
    "FORCE_SET_META_DATA": (op, res) => {
        const file = fileStore.find(f => f.meta_data.fileReference === op.fr);
        if (!file) return new Error(`File ${op.fr} not found.`);

        if (
            !is_settable_meta_data(op.meta_data)
            || op.meta_data.fileReference !== file.meta_data.fileReference
        ) {
            return new Error("Tried to set invalid meta data");
        }

        const oldMetaData = file.meta_data;
        const oldToken = file.recency_token;
        (file as any).meta_data = op.meta_data;
        (file as any).recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                (file as any).recency_token = oldToken;
                (file as any).meta_data = oldMetaData;
            },
            events: [{
                type: "CHANGE_META_DATA",
                ...file,
                file_reference: file.meta_data.fileReference
            }]
        }
    },
    "UPDATE_META_DATA": (op, res) => {
        const file = fileStore.find(f => f.meta_data.fileReference === op.fr);
        if (!file) return new Error(`File ${op.fr} not found.`);
        if (file.recency_token !== op.token) return new Error(`File recency token outdated.`);

        const oldMetaData = file.meta_data;
        const oldToken = file.recency_token;

        const meta_data = {
            ...file.meta_data,
        };

        for (const key of Object.keys(op.update_with)) {
            if (op.update_with[key] === null) {
                delete meta_data[key];
            } else {
                meta_data[key] = op.update_with[key]!;
            }
        }

        if (
            !is_settable_meta_data(meta_data)
            || meta_data.fileReference !== file.meta_data.fileReference
        ) {
            return new Error("Tried to set invalid meta data");
        }

        (file as any).meta_data = meta_data;
        (file as any).recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                (file as any).recency_token = oldToken;
                (file as any).meta_data = oldMetaData;
            },
            events: [{
                type: "CHANGE_META_DATA",
                ...file,
                file_reference: file.meta_data.fileReference
            }]
        }
    },
    "PATCH": (op, res) => {
        const file = fileStore.find(f => f.meta_data.fileReference === op.fr);
        if (!file) return new Error(`File ${op.fr} not found.`);
        if (file.recency_token !== op.token) return new Error(`File recency token outdated.`);

        const oldContents = JSON.stringify(file.contents);
        const oldToken = file.recency_token;
        const patchResults = JsonPatch.apply(file.contents, op.patches);

        if (patchResults.some(r => r !== null)) {
            (file as any).contents = JSON.parse(oldContents);
            return new Error("JSON Patching problem");
        }

        (file as any).recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                (file as any).recency_token = oldToken;
                (file as any).contents = JSON.parse(oldContents);
            },
            events: [{
                type: "CHANGE_FILE_CONTENT",
                ...file,
                file_reference: file.meta_data.fileReference
            }]
        }
    },
    "GET_ACTIVE_FILE_REFERENCES": () => {
        // Gets handled later
    }
}

export function process_operations(
    ops: AssetSideBaseOperation[],
    mode: "Bundled" | "Atomic",
    partner: Address
) {
    const rollbacks: (() => void)[] = [];
    const events: (SubscriptionEvent | FileEvent)[] = [];
    const res: OperationProcessingResult = {
        fileReferences: {},
        fileReferenceArrays: [],
        errors: []
    }

    for (const op of ops) {
        const r: ReturnType<OperationProcessor<any>> = (Processors as any)[op.type](
            op,
            res,
            partner.toString()
        );
        if (r instanceof Error) {
            if (mode === "Atomic") {
                while (rollbacks.length > 0) {
                    rollbacks.pop()!();
                }
                return r;
            }
            res.errors.push(r);
        } else if (r) {
            if (r.undo) {
                rollbacks.push(r.undo);
            }
            if (r.events) {
                events.push(...r.events);
            }
        }

    }
    trigger_events(events);
    const result: Exclude<ProtocolResponse, Error> = {
        fileReferences: res.fileReferences,
        fileReferenceArrays: res.fileReferenceArrays
    };

    if (ops.some(o => o.type === "GET_ACTIVE_FILE_REFERENCES")) {
        result.active_file_references = active_subscriptions.filter(
            s => {
                return s.partner === partner.toString()
            }
        ).map(s => s.fr)
    }

    return result;
}
