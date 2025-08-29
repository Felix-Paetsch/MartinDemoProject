import { Effect, Either } from "effect";
import { fail_as_protocol_error } from "../../../../../messaging/protocols/base/protocol_errors";
import { runEffectAsPromise } from "../../../../../utils/boundary/run";
import { Json } from "../../../../../utils/json";
import { MessagePartnerObject } from "../message_partner_object";
import { MPOCommunicationHandler } from "./mpo_communication/MPOCommunicationHandler";

export function register_ping_command(MPC: typeof MessagePartnerObject) {
    MPC.add_command({
        command: "ping",
        on_first_request: (mp: MessagePartnerObject, ich: MPOCommunicationHandler, data: Json) => {
            return Effect.gen(mp, function* () {
                return yield* ich.respond("PONG");
            }).pipe(
                fail_as_protocol_error
            )
        }
    });
}

export function ping_impl(this: MessagePartnerObject) {
    return this._send_first_mpo_message("ping").pipe(
        Effect.map(() => Either.right(true as const)),
        Effect.catchAll((error) => Effect.succeed(Either.left(error)))
    ).pipe(
        Effect.andThen(e => e),
        runEffectAsPromise
    )
}

// Keep the original function for backward compatibility during transition
export default function (MPC: typeof MessagePartnerObject) {
    register_ping_command(MPC);
} 