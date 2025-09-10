import { Effect, Schema } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { LocalComputedMessageData } from "../../../messaging/core/local_computed_message_data";
import { Message } from "../../../messaging/core/message";
import { Middleware, MiddlewareContinue } from "../../../messaging/core/middleware";
import { Json } from "../../../utils/json";

export default function add_annotation_data(
    computeData?: (message: Message, local_data: LocalComputedMessageData, current_annotation: Record<string, Json>) => Record<string, Json>
): Middleware {
    return Effect.fn("add_annotation_data_mw")(
        function* (message: Message, local_data: LocalComputedMessageData) {
            const oldAnnotation = yield* Schema.decodeUnknown(
                Schema.Record({
                    key: Schema.String,
                    value: Schema.Any
                })
            )(message.meta_data.annotation).pipe(
                Effect.orElse(() => Effect.succeed({} as Record<string, Json>))
            );

            const computed_standard_data = computeStandardData(message, local_data, oldAnnotation);

            const data = {
                ...computed_standard_data,
                ...(computeData ? computeData(message, local_data, computed_standard_data) : {})
            }

            message.meta_data.annotation = data;
            return MiddlewareContinue
        });
}


function computeStandardData(
    message: Message,
    local_data: LocalComputedMessageData,
    oldAnnotation: Record<string, Json>
): Record<string, Json> {
    const current_path = oldAnnotation.message_path && Array.isArray(oldAnnotation.message_path) ?
        oldAnnotation.message_path : [];

    return {
        message_id: uuidv4(),
        ...oldAnnotation,
        message_path: [...current_path, local_data.current_address.toString()],
        source: oldAnnotation.source || local_data.current_address.toString(),
        target: message.target.toString(),
        at_target: local_data.at_target,
        at_source: local_data.at_source,
        direction: local_data.direction,
    }
}
