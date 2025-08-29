import { Effect } from "effect";
import { ProtocolError } from "../../../../../messaging/protocols/base/protocol_errors";
import { ResultPromise } from "../../../../../utils/boundary/result";
import { EffectAsPromise } from "../../../../../utils/boundary/run";
import { Json } from "../../../../../utils/json";
import { MPOCommunicationHandler } from "../../base/mpo_commands/mpo_communication/MPOCommunicationHandler";
import { Bridge } from "../../bridge/bridge";
import { createMpo, receiveMpo } from "../create_mpo";
import { MessagePartner } from "../message_partner";

const cmd = "create_bridge";

export function bridge_impl(this: MessagePartner, data: Json = null): ResultPromise<Bridge, ProtocolError> {
    const r = EffectAsPromise(createMpo<Bridge>(
        this,
        Bridge,
        cmd,
        data
    ));
    return r();
}

export function on_bridge_impl(this: MessagePartner, cb: (mpo: Bridge, data: Json) => void): void {
    this.__bridge_cb = cb;
}

export function __bridge_cb_impl(this: MessagePartner, mpo: Bridge, data: Json): void {
    mpo.remove();
}

export function register_bridge_command(MPC: typeof MessagePartner) {
    MPC.add_command({
        command: cmd,
        on_first_request: (mp: MessagePartner, im: MPOCommunicationHandler, data: Json) => {
            return receiveMpo<Bridge>(mp, im, Bridge, (mpo) => {
                return mp.__bridge_cb(mpo, data);
            }).pipe(Effect.withSpan(cmd))
        }
    });
}

// Keep the original function for backward compatibility during transition
export default function (MPC: typeof MessagePartner) {
    register_bridge_command(MPC);
}