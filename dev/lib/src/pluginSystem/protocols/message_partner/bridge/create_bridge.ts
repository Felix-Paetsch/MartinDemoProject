import { SchemaTranscoder, AnythingTranscoder, send_await_response_transcoded, receive_transcoded, send_transcoded } from "../../../../middleware/protocol";
import MessageChannel from "../../../../middleware/channel";
import { Schema } from "effect";
import PluginMessagePartner from "../../../plugin_lib/message_partner/plugin_message_partner";
import uuidv4 from "../../../../utils/uuid";
import Bridge from "../../../plugin_lib/message_partner/bridge";
import { message_partner_protocol } from "../message_partner_protocol";

export type CreateBridgeError = Error;
export const create_bridge_protocol = message_partner_protocol(
    "create_bridge",
    async (mc: MessageChannel, initiator: PluginMessagePartner) => {
        const uuid = uuidv4();
        const b = new Bridge(initiator, uuid, initiator);
        const res = await send_await_response_transcoded(
            mc, SchemaTranscoder(Schema.String), uuid, AnythingTranscoder
        );
        if (res instanceof Error) return res;
        return b;
    },
    async (mc: MessageChannel, responder: PluginMessagePartner) => {
        const res = await receive_transcoded(mc, SchemaTranscoder(Schema.String));
        if (res instanceof Error) return;
        const b = new Bridge(responder, res, responder);
        await responder._trigger_on_bridge_request(b);
        await mc.send("OK");
    }
);
