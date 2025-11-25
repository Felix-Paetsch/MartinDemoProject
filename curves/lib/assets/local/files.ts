import { MetaData } from "../types"

export function is_settable_meta_data(md: { [key: string]: string }): md is MetaData {
    return (
        ["LOCAL", "PERSISTED"].includes(md.fileType!)
        && !!md.fileReference
        && !md.fileReference.startsWith("sf:")
    )
}
