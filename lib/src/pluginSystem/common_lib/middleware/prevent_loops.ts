import { Effect, Schema } from "effect";
import { LocalComputedMessageData } from "../../../messaging/base/local_computed_message_data";
import { Message } from "../../../messaging/base/message";
import { MiddlewareInterrupt } from "../../../messaging/base/middleware";
import { Json } from "../../../utils/json";

export const prevent_loops = Effect.fn("prevent_loops")(function* (message: Message, local_data: LocalComputedMessageData) {
    const annotation = yield* Schema.decodeUnknown(
        Schema.Record({
            key: Schema.String,
            value: Schema.Any
        })
    )(message.meta_data.annotation).pipe(
        Effect.orElse(() => Effect.succeed({} as Record<string, Json>))
    );

    const mp = annotation.message_path;
    if (Array.isArray(mp)) {
        if (mp.length > 4) {
            console.log("LOOP DETECTED", message);
            return MiddlewareInterrupt
        }
    }
});