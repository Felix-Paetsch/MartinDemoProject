import { Effect } from "effect";
import { fail_as_protocol_error } from "../../../../../messaging/protocols/base/protocol_errors";
import { Json } from "../../../../../utils/json";
import { MessagePartnerObject } from "../message_partner_object";
import { MPOCommunicationHandler } from "./mpo_communication/MPOCommunicationHandler";


export function register_remove_command(MPC: typeof MessagePartnerObject) {
    MPC.add_command({
        command: "remove_mpo",
        on_first_request: (mp: MessagePartnerObject, ich: MPOCommunicationHandler, data: Json) => {
            return Effect.gen(mp, function* () {
                this.removed = true;
                this.__remove_cb(data);
                return yield* ich.respond("OK");
            }).pipe(
                fail_as_protocol_error
            )
        }
    });
}

export function on_remove_impl(this: MessagePartnerObject, cb: (data: Json) => void) {
    this.__remove_cb = cb;
}

export function __remove_cb_impl(this: MessagePartnerObject, data: Json): void {
    // Default implementation - can be overridden
}

export function remove_impl(this: MessagePartnerObject, data: Json = null) {
    return Effect.gen(this, function* () {
        this.removed = true;
        return yield* this._send_first_mpo_message("remove_mpo", data);
    }).pipe(
        Effect.ignore,
        Effect.runPromise
    )
}

// Keep the original function for backward compatibility during transition
export default function (MPC: typeof MessagePartnerObject) {
    register_remove_command(MPC);
}