import { Data } from "effect";
import { Json } from "../../../utils/json";
import { MessageChannelTransmissionError } from "../communication_channel";
import { Message } from "../message";
import { AddressNotFoundError } from "../send";

export type MessageTransmissionError =
    AddressNotFoundError
    | MessageChannelTransmissionError

export function isMessageTransmissionError(e: Error): e is MessageTransmissionError {
    return e instanceof AddressNotFoundError ||
        e instanceof MessageChannelTransmissionError
}

export class InvalidMessageFormatError extends Data.TaggedError("InvalidMessageFormatError")<{
    message?: string,
    error: Error,
    data?: Json,
    Message?: Message
}> { }