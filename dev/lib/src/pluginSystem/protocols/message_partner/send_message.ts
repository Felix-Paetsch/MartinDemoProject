import { Json } from "../../../messaging/core/message"
import { message_partner_protocol } from "./message_partner_protocol"

export const send_message = message_partner_protocol(
    "send_message_partner_message",
    async (mc, mp, init_data: Json) => {
        await mc.send(init_data);
    },
    async (mc, responder) => {
        const data = await mc.next();
        if (data instanceof Error) return;
        responder._trigger_on_message_partner_message(data);
    }
)
