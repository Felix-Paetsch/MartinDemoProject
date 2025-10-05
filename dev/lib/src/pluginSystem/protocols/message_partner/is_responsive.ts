import { Schema } from "effect";
import { message_partner_protocol } from "./message_partner_protocol"
import { Transcoder } from "../../../utils/exports";

export const is_responsive = message_partner_protocol(
    "send_message_partner_message",
    async (mc) => {
        return mc.next_decoded(Transcoder.SchemaTranscoder(Schema.Boolean))
    },
    async (mc) => {
        mc.send_encoded(Transcoder.SchemaTranscoder(Schema.Boolean), true)
    }
)
