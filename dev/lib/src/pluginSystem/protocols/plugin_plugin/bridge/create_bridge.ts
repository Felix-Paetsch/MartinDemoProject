import { protocol, SchemaTranscoder, AnythingTranscoder, send_await_response_transcoded, receive_transcoded, send_transcoded } from "../../../../middleware/protocol";
import { findPluginMessagePartner } from "../../findResponder";
import MessageChannel from "../../../../middleware/channel";
import { Schema } from "effect";
import PluginMessagePartner from "../../../plugin_lib/message_partner/plugin_message_partner";
import { v4 as uuidv4 } from "uuid";
import Bridge from "../../../plugin_lib/message_partner/bridge";

export type CreateBridgeError = Error;
export const create_bridge_protocol = protocol(
    "create_bridge",
    SchemaTranscoder(Schema.Struct({
        plugin_message_partner_uuid: Schema.String,
        plugin_instance_id: Schema.String
    })),
    findPluginMessagePartner,
    async (mc: MessageChannel, initiator: PluginMessagePartner) => {
        const uuid = uuidv4();
        const b = new Bridge(initiator, uuid);
        const res = await send_await_response_transcoded(
            mc, SchemaTranscoder(Schema.String), uuid, AnythingTranscoder
        );
        if (res instanceof Error) return res;
        return b;
    },
    async (mc: MessageChannel, responder: PluginMessagePartner) => {
        const res = await receive_transcoded(mc, SchemaTranscoder(Schema.String));
        if (res instanceof Error) return;
        const b = new Bridge(responder, res);
        await responder._trigger_on_bridge_request(b);
        await mc.send("OK");
    }
);