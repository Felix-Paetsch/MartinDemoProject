import { Data } from "effect";
import { Address } from "../address";
import { Message } from "../message";

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

export class MessageDeserializationError extends Data.TaggedError("MessageDeserializationError")<{}> { }

export class MessageChannelTransmissionError extends Error {
    constructor(readonly error: Error) {
        super("Message Channel Transmission Error: " + error.message, { cause: error });
    }
}

export type Anomaly = AddressNotFound | MessageSerializationError | MessageDeserializationError | MessageChannelTransmissionError;