import { Connection } from "./core/connection";
import Port from "./core/port";

import * as MW from "./core/middleware";
import { Message } from "./core/message";
import { Address, LocalAddress } from "./core/address";
import type { Json } from "../utils/json";

import * as Errors from "./core/errors/errors";
import * as Anomalies from "./core/errors/anomalies";
import * as ErrorsMain from "./core/errors/main";

import { collection_middleware as cmw } from "./middleware/collection";
import { partition_middleware as pmw, PartitionMiddlewareKeys as _PartitionMiddlewareKeys } from "./middleware/partition";
import { guard_middleware as gmw } from "./middleware/guard";
import { empty_middleware as emw } from "./middleware/empty";
import { comsume_message as cm } from "./middleware/consume";

import * as Logging from "./debug/logging/logging"

export namespace Failure {
    export type MessagingError = Errors.MessagingError;
    export type Anomaly = Anomalies.Anomaly;
    export const reportAnomaly = Anomalies.reportAnomaly;

    export const PortClosedError = Errors.PortClosedError;
    export const AddressAlreadyInUseError = Errors.AddressAlreadyInUseError;
    export const CallbackError = Errors.CallbackError;
    export const AddressNotFound = Anomalies.AddressNotFound;
    export const MessageSerializationError = Anomalies.MessageSerializationError;
    export const MessageDeserializationError = Anomalies.MessageDeserializationError;
    export const MessageChannelTransmissionError = Anomalies.MessageChannelTransmissionError;
    export const AddressDeserializationError = Anomalies.AddressDeserializationError;
    export const ReportedAnomaly = Anomalies.ReportedAnomaly;

    export type ErrorHandler = ErrorsMain.ErrorHandler;
    export type AnomalyHandler = ErrorsMain.AnomalyHandler;
    export const getErrorHandler = ErrorsMain.getErrorHandler;
    export const getAnomalyHandler = ErrorsMain.getAnomalyHandler;
    export const setErrorHandler = ErrorsMain.setErrorHandler;
    export const setAnomalyHandler = ErrorsMain.setAnomalyHandler;
    export const clearErrorHandler = ErrorsMain.clearErrorHandler;
    export const clearAnomalyHandler = ErrorsMain.clearAnomalyHandler;
}

export namespace Middleware {
    export type Middleware = MW.Middleware;
    export const collection_middleware = cmw;
    export const partition_middleware = pmw;
    export type PartitionMiddlewareKeys<T> = _PartitionMiddlewareKeys<T>;
    export const guard_middleware = gmw;
    export const empty_middleware = emw;
    export const comsume_message = cm;
    export const register_global_middleware = MW.register_global_middleware;
    export const clear_global_middleware = MW.clear_global_middleware;
    export const Continue = MW.MiddlewareContinue;
    export const Interrupt = MW.MiddlewareInterrupt;
    export type Passthrough = MW.MiddlewarePassthrough;
    export const isMiddlewareContinue = MW.isMiddlewareContinue;
    export const isMiddlewareInterrupt = MW.isMiddlewareInterrupt;
}

export namespace Debug {
    export const set_logging_target = Logging.set_logging_target
}

export {
    Connection,
    Port,
    Address,
    LocalAddress,
    Message,
    type Json
};
