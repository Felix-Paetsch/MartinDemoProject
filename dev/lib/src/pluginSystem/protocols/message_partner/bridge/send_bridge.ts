import MessageChannel from "../../../../middleware/channel";
import Bridge from "../../../plugin_lib/message_partner/bridge";
import { Json } from "../../../../utils/json";
import { message_partner_protocol } from "../message_partner_protocol";

export type CreateBridgeError = Error;

export const send_bridge_protocol = message_partner_protocol(
    "send_bridge",
    async (mc: MessageChannel, initiator: Bridge, data: Json) => {
        return await mc.send(data);
    },
    async (mc: MessageChannel, responder: Bridge) => {
        const data = await mc.next();
        if (data instanceof Error) return;
        await responder._trigger_on_message(data);
    }
);