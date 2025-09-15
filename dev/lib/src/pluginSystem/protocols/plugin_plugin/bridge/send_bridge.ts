import { Protocol, registerProtocol } from "../../../../middleware/protocol";
import { findBridge } from "../../findResponder";
import MessageChannel from "../../../../middleware/channel";
import { Effect } from "effect";
import { failOnError } from "../../../../messagingEffect/utils";
import { PluginMessagePartnerID } from "../../../plugin_lib/message_partner/plugin_message_partner";
import Bridge from "../../../plugin_lib/message_partner/bridge";
import { Json } from "pc-messaging-kernel/utils/json";

export type CreateBridgeError = Error;
export const send_bridge_protocol: Protocol<
    Bridge,
    Bridge,
    void,
    Json,
    {
        plugin_message_partner_uuid: PluginMessagePartnerID,
        plugin_instance_id: string,
        bridge_uuid: string
    }
> = {
    name: "send_bridge",
    initiate: async (mc: MessageChannel, initiator: Bridge, data: Json) => {
        return await mc.send(data);
    },
    respond: async (mc: MessageChannel, responder: Bridge) => {
        Effect.promise(() => mc.next()).pipe(
            failOnError,
            Effect.andThen((r) => Effect.promise(
                () => responder._trigger_on_message(r))
            ),
            Effect.ignore,
            Effect.runPromise
        )
    },
    findResponder: findBridge
}

registerProtocol(send_bridge_protocol);