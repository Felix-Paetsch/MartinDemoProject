import { Effect } from "effect";
import { CallbackError, callbackToEffectFn } from "../../../../utils/boundary/callbacks";
import { EffectToResult, EffectToResultFlash } from "../../../../utils/boundary/run";
import { Json } from "../../../../utils/json";
import { MessagePartnerObject } from "../base/message_partner_object";
import { MPOCommunicationHandler } from "../base/mpo_commands/mpo_communication/MPOCommunicationHandler";

export class Bridge extends MessagePartnerObject {
    send(data: Json) {
        return this._send_first_mpo_message("send_bridge", data).pipe(
            EffectToResultFlash
        );
    }

    __on_message_cb: (data: Json) => Effect.Effect<void, CallbackError> = () => Effect.void;
    on(cb: (data: Json) => void) {
        this.__on_message_cb = callbackToEffectFn(cb);
        this._send_command("on_new_listener").pipe(
            Effect.ignore,
            EffectToResult
        );
    }

    __on_listener_registered: () => Effect.Effect<void, CallbackError> = () => Effect.void;;
    on_listener_registered(cb: (b: Bridge) => void) {
        this.__on_listener_registered = () => callbackToEffectFn(cb)(this);
    }
}

Bridge.add_command({
    command: "send_bridge",
    on_first_request: (mp: Bridge, im: MPOCommunicationHandler, data: Json) => {
        return mp.__on_message_cb(data).pipe(Effect.ignore);
    }
});

Bridge.add_command({
    command: "on_new_listener",
    on_first_request: (mp: Bridge, im: MPOCommunicationHandler, data: Json) => {
        return mp.__on_listener_registered().pipe(Effect.ignore);
    }
});