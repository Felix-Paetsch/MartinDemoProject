import { FileReference } from "../types";

const systemFileReferences: FileReference[] = [];
const userFileTypesStrict = ["LOCAL", "PERSISTED"] as const;
export const userFileTypes = userFileTypesStrict as readonly string[];
export type userFileType = typeof userFileTypesStrict[number];

export function is_settable_meta_data(md: { [key: string]: string }) {
    return (
        ["LOCAL", "PERSISTED"].includes(md.fileType!)
        && md.fileReference
        && !systemFileReferences.includes(md.fileReference)
    )
}
