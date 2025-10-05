import { Schema } from "effect";
import { FileContentsS, FileReferenceS } from "../schemas";
import uuidv4 from "../../../utils/uuid";

export const CreateOperationS = Schema.Struct({
    type: Schema.Literal("CREATE"),
    fr: Schema.optionalWith(FileReferenceS, {
        default: uuidv4
    }),
    meta_data: Schema.Record({
        key: Schema.String,
        value: Schema.String
    }),
    contents: Schema.optionalWith(
        FileContentsS,
        {
            default: () => ""
        }
    )
})
