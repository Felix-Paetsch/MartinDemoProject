import { Effect, Schema } from "effect";
import { Message } from "../../../messaging/core/message";
import { Json } from "../../../utils/json";
import { MessagingEffect, Middleware } from "../../../messaging/exports";

export const prevent_loops =
    MessagingEffect.EffectToMiddleware(
        Effect.fn("prevent_loops")(function* (message: Message) {
            const annotation = yield* Schema.decodeUnknown(
                Schema.Record({
                    key: Schema.String,
                    value: Schema.Any
                })
            )(message.meta_data.annotation).pipe(
                Effect.orElse(() => Effect.succeed({} as Record<string, Json>))
            );

            const mp = annotation.message_path;
            if (Array.isArray(mp) && mp.length > 6) {
                console.log("POTENTIAL LOOP DETECTED", message);
                return Middleware.Interrupt
            }
            return Middleware.Continue
        })
    );
