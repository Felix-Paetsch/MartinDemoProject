import { Schema } from "effect";
import { FileContentsS, FileReferenceS, RecencyTokenS } from "../schemas";

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
