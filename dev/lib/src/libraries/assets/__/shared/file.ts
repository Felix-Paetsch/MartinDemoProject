import { UUID } from "../../../../utils/exports";

export type FileType = "LOCAL";
export type SystemFile = "LISTDIR";

export type FileReference = `$FR_${UUID}` | `$SFR_${SystemFile}`
export type PrimitiveValue = string | number | null | FileReference;
export type FileContents = PrimitiveValue | FileReference[] | { [key: string]: File };

export function fileReference(file: SystemFile): FileReference {
    return `$SFR_${file}`;
}
export type FileDescriptor = {
    own_reference: FileReference
    type: FileType,
}
export type File = {
    descr: FileDescriptor,
    contents: FileContents
}

export type FileStore = Map<FileReference, File>;

// https://www.npmjs.com/package/rfc6902

export type FileEvent = "Change" | "Delete"
