import { Schema } from "effect";
import { FileContentsS, FileReferenceS, RecencyTokenS } from "../schemas";
import uuidv4 from "../../../utils/uuid";

export const GetFileOperationS = Schema.Struct({
    type: Schema.Literal("FILE"),
    fr: FileReferenceS
})

export const GetMetaDataOperationS = Schema.Struct({
    type: Schema.Literal("DESCRIPTION"),
    fr: FileReferenceS
})

export const CreateOperationS = Schema.Struct({
    type: Schema.Literal("CREATE"),
    fr: FileReferenceS,
    meta_data: Schema.Record({
        key: Schema.String,
        value: Schema.String
    }),
    contents: FileContentsS
})

export const DeleteOperationS = Schema.Struct({
    type: Schema.Literal("DELETE"),
    fr: FileReferenceS
})

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

export const PatchOperationS = Schema.Struct({
    type: Schema.Literal("PATCH"),
    fr: FileReferenceS,
    patches: Schema.Any,
    token: RecencyTokenS
});

export const WriteOperationS = Schema.Struct({
    type: Schema.Literal("WRITE"),
    fr: FileReferenceS,
    contents: FileContentsS,
    token: RecencyTokenS
});

export const ForeceWriteOperationS = Schema.Struct({
    type: Schema.Literal("FORCE_WRITE"),
    fr: FileReferenceS,
    contents: FileContentsS
})
