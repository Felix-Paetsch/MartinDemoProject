import { Data } from "effect";
import { Address } from "../address";
import { Message, SerializedMessage } from "../message";

export class AddressNotFound extends Error {
    constructor(readonly address: Address) {
        super(`Address: '${address.toString()}' not found`, {
            cause: address
        });
    }
}

export class MessageSerializationError extends Data.TaggedError("MessageSerializationError")<{
    message: Message
}> { }

export class MessageDeserializationError extends Data.TaggedError("MessageDeserializationError")<{
    serialized: SerializedMessage
}> { }

export class MessageChannelTransmissionError extends Error {
    constructor(readonly error: Error) {
        super("Message Channel Transmission Error: " + error.message, { cause: error });
    }
}

export class AddressDeserializationError extends Error {
    constructor(readonly address: any) {
        super("Address not deserializable");
    }
}

export type Anomaly = AddressNotFound | MessageSerializationError | MessageDeserializationError | MessageChannelTransmissionError;
