import { AssetPlugin } from "./plugin/plugin";

export {
    type ManagedFile,
    create_managed_file,
    manage_file
} from "./library/managed_file";

export { AssetManager } from "./library/bound_environment";
export * from "./library/index";

export type {
    FileEvent,
    FileType,
    FileReference,
    FileContents,
    File,
    RecencyToken,
    MetaData
} from "./types"

export const __Plugin = AssetPlugin;
