import { findBridge } from "../../findResponder";
import MessageChannel from "../../../../middleware/channel";
import Bridge from "../../../plugin_lib/message_partner/bridge";
import { Json } from "../../../../utils/json";
import { SchemaTranscoder } from "../../../../middleware/protocol";
import { Schema } from "effect";
import { protocol } from "../../../../middleware/protocol";

export type CreateBridgeError = Error;

export const send_bridge_protocol = protocol(
    "send_bridge",
    SchemaTranscoder(Schema.Struct({
        plugin_message_partner_uuid: Schema.String,
        plugin_instance_id: Schema.String,
        bridge_uuid: Schema.String
    })),
    findBridge,
    async (mc: MessageChannel, initiator: Bridge, data: Json) => {
        return await mc.send(data);
    },
    async (mc: MessageChannel, responder: Bridge) => {
        const data = await mc.next();
        if (data instanceof Error) return;
        await responder._trigger_on_message(data);
    }
);