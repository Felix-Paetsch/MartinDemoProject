import { Effect, Schema } from "effect";
import { Address } from "./address";
import { MessageDeserializationError, MessageSerializationError } from "./errors/anomalies";
import { MessageFromString } from "../../shared_effect/schemas";

export type SerializedMessage = string;
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export class Message {
    public local_data: LocalMessageData;
    readonly __tag: "message" = "message";

    constructor(
        public target: Address,
        public content: { [key: string]: Json },
        public meta_data: { [key: string]: Json } = {}
    ) {
        this.local_data = {
            direction: "outgoing",
            at_target: false,
            at_source: true,
            current_address: Address.local_address
        }
    }

    serialize(): SerializedMessage {
        // Errors: MessageSerializationError
        return Schema.encode(MessageFromString)(this).pipe(
            Effect.mapError(() => new MessageSerializationError({ msg: this })),
            Effect.runSync
        );
    }

    static deserialize(serialized: SerializedMessage): Message {
        // Errors: MessageDeserializationError
        return Schema.decode(MessageFromString)(serialized)
            .pipe(
                Effect.mapError(() => new MessageDeserializationError({ serialized })),
                Effect.runSync
            )
    }

    static deserialize_unknown(serialized: unknown): Message | MessageDeserializationError {
        return Schema.decodeUnknown(MessageFromString)(serialized).pipe(
            Effect.mapError(() => new MessageDeserializationError({
                serialized: typeof serialized === "string" ?
                    serialized : serialized?.toString() ?? "<Input is not a string>"
            })),
            Effect.merge,
            Effect.runSync
        )
    }
}

export type TransmittableMessage = Message | SerializedMessage;

export type LocalMessageData = {
    direction: "incoming" | "outgoing" | "at_kernel";
    at_target: boolean;
    at_source: boolean;
    current_address: Address;

    [key: string]: any;
}
