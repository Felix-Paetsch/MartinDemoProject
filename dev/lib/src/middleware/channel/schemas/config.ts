import { Schema } from "effect";

Schema.Number.pipe(
    Schema.filter(
        (n) => n >= 10 || "Timeout must be greater than 0"
    )
)

export const MessageChannelConfigSchema = Schema.Struct({
    defaultMessageTimeout: Schema.optionalWith(
        Schema.Number.pipe(
            Schema.filter(n => n >= 0 || "Timeout must be greater than 0")
        ), {
        exact: true,
        default: () => 2000
    }),
    timeoutAfterInactivity: Schema.optionalWith(
        Schema.Number.pipe(
            Schema.filter(n => n >= 0 || "Timeout must be greater than 0")
        ), {
        exact: true,
        default: () => 10000
    })
});

export type MessageChannelConfig = typeof MessageChannelConfigSchema.Type;
export type MessageChannelConfigEncoded = typeof MessageChannelConfigSchema.Encoded;
