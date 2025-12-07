import { Effect, Schema } from "effect";
import { uuidv4 } from "../../utils/uuid";
import { Message } from "../core/message";
import { Middleware, MiddlewareContinue } from "../core/middleware";
import { Json } from "../../utils/json";
import { EffectToMiddleware } from "../../shared_effect/effect_middleware";

export type annotateCustomData = (message: Message, current_annotation: Record<string, Json>) => Record<string, Json>;
export function annotation_middleware(
    computeData?: annotateCustomData
): Middleware {
    return EffectToMiddleware(
        Effect.fn("annotation_middleware")(
            function* (message: Message) {
                const oldAnnotation = yield* Schema.decodeUnknown(
                    Schema.Record({
                        key: Schema.String,
                        value: Schema.Any
                    })
                )(message.meta_data.annotation).pipe(
                    Effect.orElse(() => Effect.succeed({} as Record<string, Json>))
                );

                const computed_standard_data = computeStandardData(message, oldAnnotation);
                const data = {
                    ...computed_standard_data,
                    ...(computeData ? computeData(message, computed_standard_data) : {})
                }

                message.meta_data.annotation = data;
                return MiddlewareContinue
            })
    );
}


function computeStandardData(
    message: Message,
    oldAnnotation: Record<string, Json>
): Record<string, Json> {
    const current_path = oldAnnotation.message_path && Array.isArray(oldAnnotation.message_path) ?
        oldAnnotation.message_path : [];
    const new_path = JSON.stringify(current_path[current_path.length - 1]) === JSON.stringify(message.local_data.current_address.serialize()) ?
        current_path : [...current_path, message.local_data.current_address.serialize()];
    return {
        message_id: uuidv4(),
        ...oldAnnotation,
        message_path: new_path,
        source: oldAnnotation.source || message.local_data.current_address.serialize(),
        target: message.target.serialize(),
        at_target: message.local_data.at_target,
        at_source: message.local_data.at_source,
        direction: message.local_data.direction,
    }
}
