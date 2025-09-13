import { Data, Effect } from "effect";
import { Address } from "../address";
import { Message, SerializedMessage, TransmittableMessage } from "../message";
import { applyAnomalyHandler } from "./main";

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

export class ReportedAnomaly extends Error {
    constructor(readonly anomaly: Error) {
        super(anomaly.message, { cause: anomaly });
    }
}

export type Anomaly = AddressNotFound | MessageSerializationError | MessageDeserializationError | MessageChannelTransmissionError | ReportedAnomaly;

export function reportAnomaly(anomaly: Error) {
    return applyAnomalyHandler(new ReportedAnomaly(anomaly)).pipe(Effect.runSync);
}