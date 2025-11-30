import { SystemFile, MetaData, FileReference } from "../types/base";

export const systemFiles: SystemFile[] = []

export function is_system_file(fr: FileReference) {
    return systemFiles.some(f => f.meta_data.fileReference == fr);
}
