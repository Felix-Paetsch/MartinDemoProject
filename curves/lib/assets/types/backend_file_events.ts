import { FileReference, MetaData, RecencyToken } from "./base";

export type BackendDeleteFileEvent = {
    type: "DELETE";
    file_reference: FileReference;
};

export type BackendChangeFileContentEvent = {
    type: "CHANGE_FILE_CONTENT";
    contents: string;
    meta_data: MetaData;
    recency_token: RecencyToken;
    file_reference: FileReference;
};

export type BackendChangeMetaDataEvent = {
    type: "CHANGE_META_DATA";
    meta_data: MetaData;
    recency_token: RecencyToken;
    file_reference: FileReference;
};

export type BackendFileEvent =
    | BackendDeleteFileEvent
    | BackendChangeFileContentEvent
    | BackendChangeMetaDataEvent;

export type BoundBackendFileEvent = BackendFileEvent & {
    subscription_key: string
}
