import { Schema } from "effect";
import { Json } from "../../messaging/core/message"
import { Transcoder } from "../../utils/exports";
import { message_partner_protocol } from "../../pluginSystem/protocols/message_partner/message_partner_protocol";
import { get_library } from "./index";

const libRequestTranscoder = Transcoder.SchemaTranscoder(Schema.Struct({
    lib: Schema.String,
    method: Schema.String,
    args: Schema.Array(Schema.Any)
}));

const libResponseTranscoder = Transcoder.SchemaTranscoder(Schema.Any);

export const call_local_library_method = message_partner_protocol(
    "local_library_call_lib_method",
    async (mc, mp, init_data: {
        lib: string,
        method: string,
        args: Json[]
    }) => {
        return await mc.send_await_next_transcoded(
            libRequestTranscoder, init_data,
            libResponseTranscoder
        );
    },
    async (mc, responder) => {
        const data = await mc.next_decoded(libRequestTranscoder);
        if (data instanceof Error) return;

        const lib = get_library(data.lib);
        if (!lib) return;

        const res = await lib.evalue_library_method(
            mc.partner,
            data.method,
            ...data.args
        );

        if (res instanceof Error) return;
        mc.send_encoded(libResponseTranscoder, res);
    }
)


export const call_plugin_method = message_partner_protocol(
    "local_library_call_plugin_method",
    async (mc, mp, init_data: {
        lib: string,
        method: string,
        args: Json[]
    }) => {
        return await mc.send_await_next_transcoded(
            libRequestTranscoder, init_data,
            libResponseTranscoder
        );
    },
    async (mc, responder) => {
        const data = await mc.next_decoded(libRequestTranscoder);
        if (data instanceof Error) return;

        const lib = get_library(data.lib);
        if (!lib) return;

        const res = await lib.evalue_plugin_method(
            responder.env,
            data.method,
            ...data.args
        );
        if (res instanceof Error) return;
        mc.send_encoded(libResponseTranscoder, res);
    }
)
