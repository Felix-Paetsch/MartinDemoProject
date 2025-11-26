import { ReadonlyJson } from "pc-messaging-kernel/utils";

export type FileType = "LOCAL" | "SYSTEM" | "PERSISTED";
export type RecencyToken = string;
export type RegexString = string;

export type FileReference = string;
export type FileContents = ReadonlyJson;
export type MetaData = {
    readonly fileType: FileType,
    readonly fileReference: FileReference,
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

export type FileStore = Map<FileReference, File>;

export type DeleteFileEvent = {
    type: "DELETE";
    file_reference: FileReference;
};

export type ChangeFileContentEvent = {
    type: "CHANGE_FILE_CONTENT";
    contents: FileContents;
    meta_data: MetaData;
    recency_token: RecencyToken;
    file_reference: FileReference;
};

export type ChangeMetaDataEvent = {
    type: "CHANGE_META_DATA";
    meta_data: MetaData;
    recency_token: RecencyToken;
    file_reference: FileReference;
};

export type FileEvent =
    | DeleteFileEvent
    | ChangeFileContentEvent
    | ChangeMetaDataEvent;

export type SubscriptionCallback = (e: FileEvent) => void | Promise<void>
export type SubscriptionId = string


