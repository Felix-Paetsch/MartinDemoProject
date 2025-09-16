import { message_partner_protocol } from "../message_partner_protocol";
import MessageChannel from "../../../../middleware/channel";
import Bridge from "../../../plugin_lib/message_partner/bridge";
import { reportAnomaly } from "../../../../messaging/core/errors/anomalies";

export const trigger_on_listener_registered = message_partner_protocol(
    "bridge_listener_registered",
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