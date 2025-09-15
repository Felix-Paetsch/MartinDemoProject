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
    name: "send_bridge",
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