import { Effect } from "effect";
import { ProtocolError } from "../../../../../messaging/protocols/base/protocol_errors";
import { ResultPromise } from "../../../../../utils/boundary/result";
import { EffectAsPromise } from "../../../../../utils/boundary/run";
import { Json } from "../../../../../utils/json";
import { MPOCommunicationHandler } from "../../base/mpo_commands/mpo_communication/MPOCommunicationHandler";
import { Bridge } from "../../bridge/bridge";
import { createMpo, receiveMpo } from "../create_mpo";
import { MessagePartner } from "../message_partner";

export default function (MPC: typeof MessagePartner) {
    const cmd = "create_bridge";
    MPC.prototype.bridge = function (data: Json = null): ResultPromise<Bridge, ProtocolError> {
        const r = EffectAsPromise(createMpo<Bridge>(
            this,
            Bridge,
            cmd,
            data
        ));
        return r();
    }

    MPC.prototype.on_bridge = function (cb: (mpo: Bridge, data: Json) => void): void {
        this.__bridge_cb = cb;
    }

    MPC.prototype.__bridge_cb = function (mpo: Bridge, data: Json): void {
        mpo.remove();
    }

    MPC.add_command({
        command: cmd,
        on_first_request: (mp: MessagePartner, im: MPOCommunicationHandler, data: Json) => {
            return receiveMpo<Bridge>(mp, im, Bridge, (mpo) => {
                return mp.__bridge_cb(mpo, data);
            }).pipe(Effect.withSpan(cmd))
        }
    });
}