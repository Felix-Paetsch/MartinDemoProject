import { Effect } from "effect";
import { Json } from "../../utils/json";
import { Address } from "../base/address";
import { ProtocolCommunicationHandler } from "./base/communicationHandler";
import { ProtocolError, ProtocolErrorN } from "./base/protocol_errors";
import { Protocol } from "./protocol";

export default function ProtocolF<S, T>(
    ident: {
        protocol_name: string,
        protocol_ident: Json,
        protocol_version: string
    },
    run: (address: Address, data: Json) => Effect.Effect<S, ProtocolError>,
    on_first_request: (pch: ProtocolCommunicationHandler) =>
        Effect.Effect<void, ProtocolError>
): typeof Protocol<S, T> {
    return class ProtocolFC extends Protocol<S, T> {
        constructor() {
            super(
                ident.protocol_name,
                ident.protocol_ident,
                ident.protocol_version
            )
        }

        run(address: Address, data: Json): Effect.Effect<S, ProtocolError> {
            return run(address, data).pipe(
                Effect.withSpan("ProtocolF_run")
            )
        }

        on_first_request(pch: ProtocolCommunicationHandler): Effect.Effect<void, ProtocolError> {
            return on_first_request(pch).pipe(
                Effect.withSpan("ProtocolF_on_first_request")
            )
        }
    }
}

export function disallowRun() {
    return Effect.fail(ProtocolErrorN({
        message: "Not implemented"
    })).pipe(Effect.withSpan("disallowRunProtocol"));
}

export function disallowFirstRequest(pch: ProtocolCommunicationHandler) {
    return pch.not_implemented_error().pipe(
        Effect.withSpan("disallowFirstRequestOnProtocol")
    );
}