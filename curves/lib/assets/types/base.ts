import { Json, ReadonlyJson } from "pc-messaging-kernel/utils";

export type FileType = "LOCAL" | "SYSTEM" | "PERSISTED";
export type RecencyToken = string;
export type RegexString = string;

export type FileReference = string;
export type FileContents = Json;
export type MetaData = {
    fileType: FileType,
    fileReference: FileReference,
} & Record<string, string>;
export type FileDescription = {
    meta_data: MetaData,
    recency_token: RecencyToken
};

export type File = FileDescription & {
    contents: FileContents
}
export type SystemFile = File & {
    meta_data: {
        fileType: "SYSTEM"
    }
}
export type BackendFile = FileDescription & {
    contents: string
}
export type BackendSystemFile = BackendFile & {
    meta_data: {
        fileType: "SYSTEM"
    }
}
