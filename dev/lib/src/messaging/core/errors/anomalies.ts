import { Data } from "effect";
import { Address } from "../address";
import { Message, SerializedMessage, TransmittableMessage } from "../message";

export class AddressNotFound extends Error {
    constructor(readonly address: Address) {
        super(`Address: '${address.toString()}' not found`, {
            cause: address
        });
    }
}

export class MessageSerializationError extends Data.TaggedError("MessageSerializationError")<{
    msg: Message
}> { }

export class MessageDeserializationError extends Data.TaggedError("MessageDeserializationError")<{
    serialized: SerializedMessage
}> { }

export class MessageChannelTransmissionError extends Data.TaggedError("MessageChannelTransmissionError")<{
    msg: TransmittableMessage,
    cause: Error
}> {
    constructor(readonly error: Error, readonly msg: TransmittableMessage) {
        super({
            msg,
            cause: error
        });
    }
}

export class AddressDeserializationError extends Error {
    constructor(readonly address: any) {
        super("Address not deserializable", { cause: address });
    }
}

export type Anomaly = AddressNotFound | MessageSerializationError | MessageDeserializationError | MessageChannelTransmissionError;
