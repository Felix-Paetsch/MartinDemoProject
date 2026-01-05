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
    async () => { },
    async (mc, responder, data: {
        type: string,
        data: Json
    }) => {
        responder._trigger_on_message_partner_message(
            data.type,
            data.data
        );
    }
)

export const send_message_acknowledge = message_partner_protocol(
    "send_message_partner_message_acknowledge",
    async (mc, mp) => {
        await mc.next();
    },
    async (mc, responder, data: {
        type: string,
        data: Json
    }) => {
        await responder._trigger_on_message_partner_message(
            data.type,
            data.data
        );
        mc.send("Ok")
    }
)
