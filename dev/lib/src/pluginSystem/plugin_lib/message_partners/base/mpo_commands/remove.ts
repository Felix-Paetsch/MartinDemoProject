import { Effect } from "effect";
import { callbackToEffect } from "../../../../../utils/boundary/callbacks";
import { EffectToResult, ResultToEffect } from "../../../../../utils/boundary/run";
import { MessagePartner } from "../../message_partner/message_partner";
import { MessagePartnerObject } from "../message_partner_object";

export function register_remove_command(MPC: typeof MessagePartnerObject) {
    MPC.add_command({
        command: "remove_mpo",
        on_first_request: (mp: MessagePartnerObject) => {
            return ResultToEffect(mp.remove("INTERNAL"));
        }
    });
}

export function on_remove_impl(this: MessagePartnerObject, cb: () => void) {
    this.__remove_cb = cb;
}

export function __remove_cb_impl(this: MessagePartnerObject): void { }

export function remove(this: MessagePartnerObject, remove_where: "INTERNAL" | "EXTERNAL" | "BOTH" = "BOTH") {
    return Effect.gen(this, function* () {
        this.removed = true;
        const eff = [];
        if (remove_where === "EXTERNAL" || remove_where === "BOTH") {
            eff.push(this._send_first_mpo_message("remove_mpo"));
        }
        if (remove_where === "INTERNAL" || remove_where === "BOTH") {
            eff.push(callbackToEffect(this.__remove_cb));
        }

        const messagePartner = this.message_partner;
        if (messagePartner === this) {
            MessagePartner.message_partners = MessagePartner.message_partners.filter(mp => mp !== this);
        } else {
            messagePartner._message_partner_objects = messagePartner._message_partner_objects.filter(mpo => mpo !== this);
        }

        yield* Effect.all(
            eff,
            {
                concurrency: "unbounded",
                mode: "either"
            }
        );
    }).pipe(
        Effect.ignore,
        EffectToResult
    )
}