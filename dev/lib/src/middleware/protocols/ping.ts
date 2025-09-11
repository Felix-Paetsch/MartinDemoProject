import { Effect, Either } from "effect";
import { Json } from "../../utils/json";
import { Address } from "../base/address";
import { ProtocolCommunicationHandler } from "./base/communicationHandler";
import { ProtocolError, ProtocolErrorN } from "./base/protocol_errors";
import { Protocol } from "./protocol";

export class PingProtocol extends Protocol<Either.Either<true, ProtocolError>, void> {
    constructor() {
        super("ping", "ping", "1.0.0");
    }

    run(address: Address, data: Json) {
        return Effect.gen(this, function* () {
            yield* yield* this.send_first_message(address, "Ping")
            return true as const;
        }).pipe(
            Effect.catchAll((e) => Effect.gen(function* () {
                if (e instanceof ProtocolError) {
                    return yield* e
                }
                return yield* ProtocolErrorN({
                    error: e as Error
                });
            })),
            Effect.either,
            Effect.withSpan("run")
        )
    }

    on_first_request = Effect.fn("on_first_request")(
        function* (pch: ProtocolCommunicationHandler) {
            const _ = yield* pch.close("Pong", true);
            return yield* Effect.void
        }
    )
}

export const Ping = new PingProtocol();