import { Schema } from "effect";

export const FileTypeS = Schema.Literal("LOCAL", "SYSTEM", "PERSISTED");
export const SystemFileS = Schema.Literal("LISTDIR");

export const FileReferenceS = Schema.String;
export const FileContentsS = Schema.Any;

export const RecencyTokenS = Schema.Number;

export const MetaDataS = Schema.Struct(
    {
        fileType: FileTypeS,
        fileReference: FileReferenceS
    },
    { key: Schema.String, value: Schema.String }
)

export const FileDescriptionS = Schema.Struct({
    meta_data: MetaDataS,
    recency_token: RecencyTokenS
})

export const FileS = Schema.Struct({
    recency_token: RecencyTokenS,
    meta_data: MetaDataS,
    contents: FileContentsS
})

export const DeleteFileEventS = Schema.Struct({
    type: Schema.Literal("DELETE"),
    recency_token: RecencyTokenS,
    file_reference: FileReferenceS
})

export const ChangeFileContentEventS = Schema.Struct({
    type: Schema.Literal("CHANGE_FILE_CONTENT"),
    contents: FileContentsS,
    meta_data: MetaDataS,
    recency_token: RecencyTokenS,
    file_reference: FileReferenceS,
})

export const ChangeMetaDataEventS = Schema.Struct({
    type: Schema.Literal("CHANGE_META_DATA"),
    contents: FileContentsS,
    meta_data: MetaDataS,
    recency_token: RecencyTokenS,
    file_reference: FileReferenceS,
})

export const FileEventS = Schema.Union(
    DeleteFileEventS,
    ChangeFileContentEventS,
    ChangeMetaDataEventS
);
