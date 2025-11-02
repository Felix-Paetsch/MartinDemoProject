import { File, FileReference } from "../exports";
import { FileDescription } from "../types";
import { fileStore, OperationProcessingResult } from "./file_operation_processors";

export function set_file_response(res: OperationProcessingResult, fr: File | FileReference) {
    let file: File | undefined;
    if (typeof fr === "string") {
        file = fileStore.find(f => f.meta_data.fileReference == fr);
    } else {
        file = fr;
    }
    if (!file) {
        return new Error(`File "${fr}" not found`);
    }
    res.fileReferences[file.meta_data.fileReference] = file;
}

export function get_description(f: File): FileDescription {
    return {
        recency_token: f.recency_token,
        meta_data: f.meta_data
    }
}

export function set_description_response(res: OperationProcessingResult, fr: File | FileReference) {
    let file: File | undefined;
    if (typeof fr === "string") {
        file = fileStore.find(f => f.meta_data.fileReference == fr);
    } else {
        file = fr;
    }
    if (!file) {
        return new Error(`File "${fr}" not found`);
    }

    const ffr = file.meta_data.fileReference;
    if (!res.fileReferences[ffr]) {
        res.fileReferences[ffr] = get_description(file);
    }

    if (res.fileReferences[ffr].contents) {
        res.fileReferences[ffr].contents = file.contents;
    }
}

export function filter_by_meta_data(filter_by: { [key: string]: string }) {
    const regex: { [key: string]: RegExp } = {};
    try {
        Object.keys(filter_by).forEach((k: string) => {
            regex[k] = new RegExp(filter_by[k]!)
        })
    } catch (e: any) {
        return new Error(`Invalid RegExp: ${e.message!}`);
    }

    return fileStore.filter(f => Object.keys(filter_by).every(
        key => typeof f.meta_data[key] !== "undefined" && regex[key]!.test(f.meta_data[key])
    ));
}

