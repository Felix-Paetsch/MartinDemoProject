import { Protocol, registerProtocol } from "../../../../middleware/protocol";
import { findBridge } from "../../findResponder";
import MessageChannel from "../../../../middleware/channel";
import { Effect } from "effect";
import { PluginMessagePartnerID } from "../../../plugin_lib/message_partner/plugin_message_partner";
import Bridge from "../../../plugin_lib/message_partner/bridge";

export const trigger_on_listener_registered: Protocol<
    Bridge,
    Bridge,
    void,
    null,
    {
        plugin_message_partner_uuid: PluginMessagePartnerID,
        plugin_instance_id: string,
        bridge_uuid: string
    }
> = {
    name: "bridge_listener_registered",
    initiate: async (mc: MessageChannel, initiator: Bridge) => {
        await mc.next();
    },
    respond: async (mc: MessageChannel, responder: Bridge) => {
        Effect.tryPromise({
            try: () => responder._trigger_on_listener_registered(responder),
            catch: (e) => e as Error
        }).pipe(
            Effect.ignore,
            Effect.andThen(() => Effect.promise(() => mc.send("OK"))),
            Effect.runPromise
        )
    },
    findResponder: findBridge
}

registerProtocol(trigger_on_listener_registered);