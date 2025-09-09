import { Context, Data, Effect, Option } from "effect";
import { LocalComputedMessageDataT } from "./local_computed_message_data";
import { Message, MessageT, SerializedMessage, SerializedMessageT } from "./message";

export type MessagingError = Error;
export type MessagingErrorHandler = (e: MessagingError) => void | Promise<void>;

let errorHandler: MessagingErrorHandler = (e) => { }
export const setErrorHandler = (e: MessagingErrorHandler) => {
        errorHandler = e;
}

export const getErrorHandler = () => {
        return errorHandler;
}
export const clearErrorHandler = () => {
        errorHandler = () => { }
}

export const applyErrorHandler = (e: MessagingError) => Effect.promise(
        () => Promise.resolve(errorHandler(e))
)

export type Anomaly = Error;
export type AnomalyHandler = (e: Anomaly) => void | Promise<void>;

let anomalyHandler: AnomalyHandler = (e) => { }
export const setAnomalyHandler = (e: AnomalyHandler) => {
        errorHandler = e;
}

export const getAnomalyHandler = () => {
        return errorHandler;
}
export const clearAnomalyHandler = () => {
        errorHandler = () => { }
}

export const applyAnomalyHandler = (e: MessagingError) => Effect.promise(
        () => Promise.resolve(errorHandler(e))
)


