import { Schema } from "effect";
import { FileReferenceS } from "../schemas";

export const GetFileOperationS = Schema.Struct({
    type: Schema.Literal("FILE"),
    fr: FileReferenceS
})

export const GetMetaDataOperationS = Schema.Struct({
    type: Schema.Literal("DESCRIPTION"),
    fr: FileReferenceS
})

