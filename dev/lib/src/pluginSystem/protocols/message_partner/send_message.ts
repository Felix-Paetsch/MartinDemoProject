import { Schema } from "effect";
import { Json } from "../../../messaging/core/message"
import { message_partner_protocol } from "./message_partner_protocol"
import { Transcoder } from "../../../utils/exports";

const sendTranscoder = Transcoder.SchemaTranscoder(Schema.Struct({
    type: Schema.String,
    data: Schema.Any
}))

export const send_message = message_partner_protocol(
    "send_message_partner_message",
    async (mc, mp, init_data: {
        type: string,
        data: Json
    }) => {
        await mc.send_encoded(sendTranscoder, init_data);
    },
    async (mc, responder) => {
        const data = await mc.next_decoded(sendTranscoder);
        if (data instanceof Error) return;
        responder._trigger_on_message_partner_message(
            data.type,
            data.data
        );
    }
)
