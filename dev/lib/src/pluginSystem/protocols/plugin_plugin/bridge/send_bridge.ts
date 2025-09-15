import { PluginEnvironment } from "../../../plugin_lib/plugin_environment";
import { Protocol, registerProtocol } from "../../../../middleware/protocol";
import { KernelEnvironment } from "../../../kernel_lib/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../../plugin_lib/plugin_ident";
import { findKernel, findPlugin, findPluginMessagePartner, findBridge } from "../../findResponder";
import MessageChannel from "../../../../middleware/channel";
import { Effect, Schema } from "effect";
import { AddressFromString } from "../../../../messagingEffect/schemas";
import { failOnError } from "../../../../messagingEffect/utils";
import PluginMessagePartner, { PluginMessagePartnerID } from "../../../plugin_lib/message_partner/plugin_message_partner";
import { v4 as uuidv4 } from "uuid";
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