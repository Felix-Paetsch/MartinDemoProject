import { Effect } from "effect";
import { ProtocolError } from "../../../../../messaging/protocols/base/protocol_errors";
import { Json } from "../../../../../utils/json";
import { MPOCommunicationHandler } from "../../base/mpo_commands/mpo_communication/MPOCommunicationHandler";
import { Signalreceiver } from "../../signal/receiver";
import { SignalSender } from "../../signal/sender";
import { createMpo, receiveMpo } from "../create_mpo";
import { MessagePartner } from "../message_partner";

declare module "pc-messaging-kernel/pluginSystem/plugin_lib/message_partners/message_partner/message_partner" {
    interface MessagePartner {
        signal(): Effect.Effect<SignalSender, ProtocolError>;
        on_signal(cb: (mpo: Signalreceiver, data: Json) => void): void,
        __signal_cb: (mpo: Signalreceiver, data: Json) => void
    }
}

export default function (MPC: typeof MessagePartner) {
    const cmd = "create_signal";
    MPC.prototype.signal = function (data: Json = null): Effect.Effect<Signalreceiver, ProtocolError> {
        return createMpo<Signalreceiver>(
            this,
            Signalreceiver,
            cmd,
            data
        );
    }

    MPC.prototype.on_signal = function (cb: (mpo: Signalreceiver, data: Json) => void): void {
        this.__signal_cb = cb;
    }

    MPC.prototype.__signal_cb = function (mpo: Signalreceiver, data: Json): void {
        mpo.remove();
    }

    MPC.add_command({
        command: cmd,
        on_first_request: (mp: MessagePartner, im: MPOCommunicationHandler, data: Json) => {
            return receiveMpo<Signalreceiver>(mp, im, Signalreceiver, (mpo) => {
                mp.__signal_cb(mpo, data);
            })
        }
    });
}