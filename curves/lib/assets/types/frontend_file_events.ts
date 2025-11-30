import { BoundBackendFileEvent } from "./backend_file_events";
import { FileContents, FileReference, MetaData, RecencyToken } from "./base";

export type DeleteFileEvent = {
    type: "DELETE";
    file_reference: FileReference;
    subscription_key: string
};

export type ChangeFileContentEvent = {
    type: "CHANGE_FILE_CONTENT";
    contents: FileContents;
    meta_data: MetaData;
    recency_token: RecencyToken;
    file_reference: FileReference;
    subscription_key: string
};

export type ChangeMetaDataEvent = {
    type: "CHANGE_META_DATA";
    meta_data: MetaData;
    recency_token: RecencyToken;
    file_reference: FileReference;
    subscription_key: string
};

export type FileEvent =
    | DeleteFileEvent
    | ChangeFileContentEvent
    | ChangeMetaDataEvent;

export type ToFrontendFileEvent<E extends BoundBackendFileEvent> = FileEvent & { type: E["type"] }
export function to_frontend_file_event<E extends BoundBackendFileEvent>(e: E): ToFrontendFileEvent<E> {
    if (e.type == "CHANGE_FILE_CONTENT") {
        return {
            type: "CHANGE_FILE_CONTENT",
            contents: JSON.parse(e.contents),
            recency_token: e.recency_token,
            meta_data: e.meta_data,
            file_reference: e.file_reference,
            subscription_key: e.subscription_key
        }
    }
    return e;
}

export type SubscriptionCallback = (e: FileEvent) => void | Promise<void>
