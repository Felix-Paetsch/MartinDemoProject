import { AddressDeserializationError } from "../address";
import { MessageDeserializationError, MessageSerializationError } from "../message";
import { applyAnomalyHandler } from "./main";
import { MiddlewareInterrupt } from "../middleware";
import { AddressNotFoundError } from "../core_send";

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
    | ReportedAnomaly;

export function reportAnomaly(anomaly: Error): MiddlewareInterrupt {
    applyAnomalyHandler(new ReportedAnomaly(anomaly));
    return MiddlewareInterrupt;
}
