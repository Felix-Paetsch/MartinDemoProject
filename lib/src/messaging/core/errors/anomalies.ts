import { Data, Effect } from "effect";
import { AddressDeserializationError, AddressNotFoundError } from "../address";
import { Message, SerializedMessage, TransmittableMessage } from "../message";
import { applyAnomalyHandler } from "./main";
import { MiddlewareInterrupt } from "../middleware";

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

export class ReportedAnomaly extends Error {
    constructor(readonly anomaly: Error) {
        // @ts-ignore
        super(anomaly.message, { cause: anomaly });
    }
}

export type Anomaly =
    AddressNotFoundError
    | AddressDeserializationError
    | MessageSerializationError
    | MessageDeserializationError
    | MessageChannelTransmissionError
    | ReportedAnomaly;

export function reportAnomaly(anomaly: Error): MiddlewareInterrupt {
    applyAnomalyHandler(new ReportedAnomaly(anomaly)).pipe(Effect.runPromise);
    return MiddlewareInterrupt;
}
