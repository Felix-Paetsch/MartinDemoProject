import { Protocol, registerProtocol } from "../../../../middleware/protocol";
import { findPluginMessagePartner } from "../../findResponder";
import MessageChannel from "../../../../middleware/channel";
import { Effect, Schema } from "effect";
import { failOnError } from "../../../../messagingEffect/utils";
import PluginMessagePartner, { PluginMessagePartnerID } from "../../../plugin_lib/message_partner/plugin_message_partner";
import { v4 as uuidv4 } from "uuid";
import Bridge from "../../../plugin_lib/message_partner/bridge";

export type CreateBridgeError = Error;
export const create_bridge_protocol: Protocol<
    PluginMessagePartner,
    PluginMessagePartner,
    Bridge | CreateBridgeError,
    null,
    {
        plugin_message_partner_uuid: PluginMessagePartnerID,
        plugin_instance_id: string
    }
> = {
    name: "create_bridge",
    initiate: async (mc: MessageChannel, initiator: PluginMessagePartner) => {
        return Effect.gen(function* () {
            const uuid = uuidv4();
            const b = new Bridge(initiator, uuid);
            yield* Effect.promise(() => mc.send_await_response(uuid)).pipe(failOnError);
            return b;
        }).pipe(
            Effect.merge,
            Effect.runPromise
        );
    },
    respond: async (mc: MessageChannel, responder: PluginMessagePartner) => {
        return Effect.gen(function* () {
            const data = yield* Effect.promise(() => mc.next()).pipe(failOnError);
            const s = yield* Schema.decodeUnknown(Schema.String)(data);
            const b = new Bridge(responder, s);
            yield* Effect.promise(() => responder._trigger_on_bridge_request(b));
            yield* Effect.promise(() => mc.send("OK"));
        }).pipe(
            Effect.ignore,
            Effect.runPromise
        )
    },
    findResponder: findPluginMessagePartner
}

registerProtocol(create_bridge_protocol);