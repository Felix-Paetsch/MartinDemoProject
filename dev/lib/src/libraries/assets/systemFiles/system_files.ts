import { MakeMutable } from "../../../utils/mutability";
import { fileStore } from "../plugin/file_operation_processors";
import { get_description } from "../plugin/operation_processor_helper";
import { SubscriptionEvent } from "../plugin/plugin";
import { FileReference, File, MetaData, FileEvent } from "../types";

export function is_settable_meta_data(md: { [key: string]: string }): md is MetaData {
    return (
        ["LOCAL", "PERSISTED"].includes(md.fileType!)
        && !!md.fileReference
        && !md.fileReference.startsWith("sf:")
    )
}

const systemFileReferences: FileReference[] = [];
export function is_system_file(fr: FileReference) {
    return systemFileReferences.includes(fr);
}

export function system_files() {
    return Object.values(systemFiles) as MakeMutable<File>[];
}

export function compute_system_file_events(base_events: readonly (SubscriptionEvent | FileEvent)[]) {
    const new_events: FileEvent[] = [];
    if (
        base_events.some(o => ["CREATE", "DELETE", "DELETE_BY_META_DATA"].includes(o.type))
    ) {
        systemFiles["sf:files"].recency_token = performance.now();
        new_events.push({
            type: "CHANGE_FILE_CONTENT",
            file_reference: "sf:files",
            ...systemFiles["sf:files"]
        });

        systemFiles["sf:events"].recency_token = performance.now();
        new_events.push({
            type: "CHANGE_FILE_CONTENT",
            file_reference: "sf:events",
            ...systemFiles["sf:events"],
            contents: JSON.parse(JSON.stringify(base_events))
        });
    }

    return new_events
}

const systemFiles = {
    "sf:files": systemFiles_files(),
    "sf:events": systemFiles_events()
} as const;

function systemFiles_files(): MakeMutable<File> {
    return {
        recency_token: performance.now(),
        get contents() {
            return fileStore.map(f => get_description(f));
        },
        meta_data: SystemFileMetaData("files")
    }
}

function systemFiles_events(): MakeMutable<File> {
    return {
        recency_token: performance.now(),
        contents: [],
        meta_data: SystemFileMetaData("events")
    }
}

function SystemFileMetaData<FR extends FileReference>(fr: FR): MetaData {
    return {
        fileType: "SYSTEM",
        fileReference: "sf:" + fr
    }
}

