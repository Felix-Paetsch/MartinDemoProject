import { Effect, flow } from "effect";
import { CallbackError, HandledError, MessagingError } from "./errors";
import { Anomaly } from "./anomalies";

export type ErrorHandler = (e: MessagingError) => void | Promise<void>;

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

export const applyErrorHandler = (e: MessagingError) => Effect.promise(
    () => Promise.resolve(!(e instanceof HandledError) && errorHandler(e))
)

export const callbackToEffectFnUnhandled = <R, Args extends any[]>(cb: (...args: Args) => R | Promise<R>) => (...args: Args) => Effect.tryPromise(
    {
        try: () => Promise.resolve(cb(...args)),
        catch: (e) => new CallbackError(e as Error),
    }
).pipe(
    Effect.withSpan("callbackToEffectUnhandled"))

export const callbackToEffectFn = flow(callbackToEffectFnUnhandled, (cb) => flow(cb, Effect.catchAll(HandledError.handleE)))
export const callbackToEffectUnhandled = <R, Args extends any[]>(cb: (...args: Args) => R | Promise<R>, ...args: Args) => callbackToEffectFnUnhandled(cb)(...args);
export const callbackToEffect = flow(callbackToEffectUnhandled, Effect.catchAll(HandledError.handleE))

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

export const applyAnomalyHandler = (e: Anomaly) => Effect.promise(
    () => Promise.resolve(!(e instanceof HandledError) && anomalyHandler(e))
)