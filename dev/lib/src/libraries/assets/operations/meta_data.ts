import { Schema } from "effect";
import { FileReferenceS, RecencyTokenS } from "../schemas";

export const SetMetaDataOperationS = Schema.Struct({
    type: Schema.Literal("SET_META_DATA"),
    fr: FileReferenceS,
    token: RecencyTokenS,
    meta_data: Schema.Record({
        key: Schema.String,
        value: Schema.String
    })
});

export const ForceSetMetaDataOperationS = Schema.Struct({
    type: Schema.Literal("FORCE_SET_META_DATA"),
    fr: FileReferenceS,
    meta_data: Schema.Record({
        key: Schema.String,
        value: Schema.String
    })
});

export const UpdateMetaDataOperationS = Schema.Struct({
    type: Schema.Literal("UPDATE_META_DATA"),
    fr: FileReferenceS,
    token: RecencyTokenS,
    update_with: Schema.Record({
        key: Schema.String,
        value: Schema.Union(Schema.String, Schema.Null)
    })
});

export const FilterByMetaDataOperationS = Schema.Struct({
    type: Schema.Literal("FILTER_BY_META_DATA"),
    filter_by: Schema.Record({
        key: Schema.String,
        value: Schema.String
    })
});

export const DeleteByMetaDataOperationS = Schema.Struct({
    type: Schema.Literal("DELETE_BY_META_DATA"),
    delete_by: Schema.Record({
        key: Schema.String,
        value: Schema.String
    })
});
