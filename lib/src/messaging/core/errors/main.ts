import { HandledError } from "./errors";
import { Anomaly } from "./anomalies";

export type ErrorHandler = (e: Error) => void | Promise<void>;

let errorHandler: ErrorHandler = (e) => { }
export const setErrorHandler = (e: ErrorHandler) => {
    errorHandler = e;
}

export const getErrorHandler = () => {
    return errorHandler;
}
export const clearErrorHandler = () => {
    errorHandler = () => { }
}

export const applyErrorHandler = async (e: Error) => {
    if (!(e instanceof HandledError)) {
        await errorHandler(e);
    }
}

export type AnomalyHandler = (e: Anomaly) => void | Promise<void>;

let anomalyHandler: AnomalyHandler = (e) => { }
export const setAnomalyHandler = (e: AnomalyHandler) => {
    anomalyHandler = e;
}

export const getAnomalyHandler = () => {
    return anomalyHandler;
}
export const clearAnomalyHandler = () => {
    errorHandler = () => { }
}

export const applyAnomalyHandler = async (e: Anomaly) => {
    if (!(e instanceof HandledError)) {
        await anomalyHandler(e);
    }
}
