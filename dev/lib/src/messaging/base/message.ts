import { Context, Effect, ParseResult, pipe, Schema } from "effect";
import { Json } from "./utils/json";
import { Address } from "./address";
import { MessageDeserializationError, MessageSerializationError } from "./errors/anomalies";
import { MessageFromString } from "./lib/message";

export class MessageT extends Context.Tag("MessageT")<
    MessageT,
    Message
>() { }

export type SerializedMessage = string;

export class Message {
    public local_data: LocalMessageData;

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
            Effect.mapError(() => new MessageSerializationError({ message: this })),
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
}

export type TransmittableMessage = Message | SerializedMessage;

export type LocalMessageData = {
    direction: "incoming" | "outgoing" | "at_kernel";
    at_target: boolean;
    at_source: boolean;
    current_address: Address;

    [key: string]: any;
}