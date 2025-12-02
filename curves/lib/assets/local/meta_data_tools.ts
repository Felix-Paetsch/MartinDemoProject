import { FileReference, FileType, MetaData } from "../types/base"

export function is_settable_meta_data(md: { [key: string]: string }, fr: FileReference): md is MetaData {
    return (
        ["LOCAL", "PERSISTED"].includes(md.fileType!)
        && md.fileReference === fr
    )
}

export function fill_meta_data_values(md: { [key: string]: string }, fr: FileReference, preferedType: Exclude<FileType, "SYSTEM"> = "LOCAL"): MetaData {
    return {
        fileType: preferedType,
        fileReference: fr, // although we know that it must be this file reference, if md sets a different one, we probably want to throw
        ...md
    }
}
