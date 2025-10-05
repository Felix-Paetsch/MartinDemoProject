import { Schema } from "effect";
import { FileReferenceS } from "../schemas";

export const DeleteOperationS = Schema.Struct({
    type: Schema.Literal("DELETE"),
    fr: FileReferenceS
})
