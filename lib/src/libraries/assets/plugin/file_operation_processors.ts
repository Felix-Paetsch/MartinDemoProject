import { Address } from "../../../messaging/exports";
import { JsonPatch } from "../../../utils/json";
import { MakeMutable } from "../../../utils/mutability";
import { AssetSideOperation } from "../operations";
import { File, FileContents, FileEvent, FileReference, MetaData, RecencyToken } from "../types";
import {
    filter_by_meta_data,
    set_file_response,
    set_description_response
} from "./operation_processor_helper";
import { SubscriptionEvent } from "./plugin";
import { is_settable_meta_data, is_system_file, system_files } from "../systemFiles/system_files";

export const fileStore: MakeMutable<File>[] = system_files();

export type OperationProcessingResult = {
    fileReferences: {
        [key: FileReference]: {
            meta_data: MetaData,
            recency_token: RecencyToken,
            contents?: FileContents
        }
    },
    fileReferenceArrays: FileReference[][],
    errors: Error[]
};

export type OperationProcessor<O extends AssetSideOperation> = (op: O, res: OperationProcessingResult, partner: Address.StringSerializedAddress) => Error | {
    undo?: () => void,
    events?: (FileEvent | SubscriptionEvent)[]
} | void;

export const Processors: {
    [Key in AssetSideOperation["type"]]: OperationProcessor<AssetSideOperation & { type: Key }>
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
    "SUBSCRIBE_FILE_REFERENCE": (op, _, partner) => {
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
    "UNSUBSCRIBE_FILE_REFERENCE": (op, _, partner) => {
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
            fileType: "LOCAL",
            ...op.meta_data,
            fileReference: op.fr,
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
        if (fileIndex < 0) { return new Error(`File ${op.fr} not found.`); }
        if (is_system_file(op.fr)) {
            return new Error(`Cant delete system file ${op.fr}`);
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

        const files = filtered.filter(f => is_system_file(f.meta_data.fileReference));

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
        if (is_system_file(file.meta_data.fileReference)) {
            return new Error(`Can't write to system file ${op.fr}`);
        }
        if (file.recency_token !== op.token) return new Error(`File recency token outdated.`);

        const oldContents = file.contents;
        const oldToken = file.recency_token;
        file.contents = op.contents;
        file.recency_token = performance.now();
        set_description_response(res, file.meta_data.fileReference);
        return {
            undo: () => {
                file.recency_token = oldToken;
                file.contents = oldContents;
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
        if (is_system_file(file.meta_data.fileReference)) {
            return new Error(`Can't write to system file ${op.fr}`);
        }

        const oldContents = file.contents;
        const oldToken = file.recency_token;
        file.contents = op.contents;
        file.recency_token = performance.now();
        set_description_response(res, file.meta_data.fileReference);
        return {
            undo: () => {
                file.recency_token = oldToken;
                file.contents = oldContents;
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
        if (is_system_file(file.meta_data.fileReference)) {
            return new Error(`Can't write to system file ${op.fr}`);
        }

        if (
            !is_settable_meta_data(op.meta_data)
            || op.meta_data.fileReference !== file.meta_data.fileReference
        ) {
            return new Error("Tried to set invalid meta data");
        }

        const oldMetaData = file.meta_data;
        const oldToken = file.recency_token;
        file.meta_data = op.meta_data;
        file.recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                file.recency_token = oldToken;
                file.meta_data = oldMetaData;
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
        if (is_system_file(file.meta_data.fileReference)) {
            return new Error(`Can't write to system file ${op.fr}`);
        }

        const oldMetaData = file.meta_data;
        const oldToken = file.recency_token;
        file.meta_data = op.meta_data;
        file.recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                file.recency_token = oldToken;
                file.meta_data = oldMetaData;
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
        if (is_system_file(file.meta_data.fileReference)) {
            return new Error(`Can't write to system file ${op.fr}`);
        }

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

        file.meta_data = meta_data;
        file.recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                file.recency_token = oldToken;
                file.meta_data = oldMetaData;
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
        if (is_system_file(file.meta_data.fileReference)) {
            return new Error(`Can't write to system file ${op.fr}`);
        }

        const oldContents = JSON.stringify(file.contents);
        const oldToken = file.recency_token;
        const patchResults = JsonPatch.apply(file.contents, op.patches);

        if (patchResults instanceof Error) return patchResults;

        file.recency_token = performance.now();
        set_description_response(res, file);
        return {
            undo: () => {
                file.recency_token = oldToken;
                file.contents = JSON.parse(oldContents);
            },
            events: [{
                type: "CHANGE_FILE_CONTENT",
                ...file,
                file_reference: file.meta_data.fileReference
            }]
        }
    },
    "GET_ACTIVE_FILE_REFERENCES": () => {
        // Gets handled individually
    }
}
