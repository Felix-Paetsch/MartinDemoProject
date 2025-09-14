import { Effect, Schema } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { Message } from "../../../messaging/core/message";
import { Middleware, MiddlewareContinue } from "../../../messaging/core/middleware";
import { Json } from "../../../utils/json";
import { EffectToMiddleware } from "../../../messagingEffect/effect_middleware";

export default function add_annotation_data(
    computeData?: (message: Message, current_annotation: Record<string, Json>) => Record<string, Json>
): Middleware {
    return EffectToMiddleware(
        Effect.fn("add_annotation_data_mw")(
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

    return {
        message_id: uuidv4(),
        ...oldAnnotation,
        message_path: [...current_path, message.local_data.current_address.serialize()],
        source: oldAnnotation.source || message.local_data.current_address.serialize(),
        target: message.target.serialize(),
        at_target: message.local_data.at_target,
        at_source: message.local_data.at_source,
        direction: message.local_data.direction,
    }
}
