import { Schema } from "effect";
import { FileReferenceS, RecencyTokenS } from "../schemas";

export const PatchOperationS = Schema.Struct({
    type: Schema.Literal("PATCH"),
    fr: FileReferenceS,
    patches: Schema.Any,
    token: RecencyTokenS
});

