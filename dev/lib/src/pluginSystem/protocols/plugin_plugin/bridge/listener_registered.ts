import { protocol, SchemaTranscoder } from "../../../../middleware/protocol";
import { findBridge } from "../../findResponder";
import MessageChannel from "../../../../middleware/channel";
import { Schema } from "effect";
import Bridge from "../../../plugin_lib/message_partner/bridge";
import { reportAnomaly } from "../../../../messaging/core/errors/anomalies";

export const trigger_on_listener_registered = protocol(
    "bridge_listener_registered",
    SchemaTranscoder(Schema.Struct({
        plugin_message_partner_uuid: Schema.String,
        plugin_instance_id: Schema.String,
        bridge_uuid: Schema.String
    })),
    findBridge,
    async (mc: MessageChannel, initiator: Bridge) => {
        await mc.next();
    },
    async (mc: MessageChannel, responder: Bridge) => {
        try {
            await responder._trigger_on_listener_registered(responder)
        } catch (e) {
            reportAnomaly(e as Error);
        }
        return await mc.send("OK");
    }
)