import { Protocol, protocol, receive_transcoded, SchemaTranscoder, send_await_response_transcoded } from "../../../middleware/protocol";
import LibraryMessagePartner from "../../plugin_lib/message_partner/library";
import { LibraryEnvironment, libraryIdentSchema } from "../../library/library_environment";
import { Json } from "../../../utils/json";
import { Schema } from "effect";
import MessageChannel from "../../../middleware/channel";

const callSchema = Schema.Struct({
    fn: Schema.String,
    args: Schema.Array(Schema.Any)
})

export const call_protocol: Protocol<LibraryMessagePartner, LibraryEnvironment, {
    fn: string;
    args: Json[];
}, {
    readonly name: string;
    readonly version: string;
}, Json> = protocol(
    "call_library_method",
    LibraryEnvironment.findTranscoder,
    LibraryEnvironment.find,
    async (mc: MessageChannel, initiator: LibraryMessagePartner, call_args: { fn: string, args: Json[] }) => {
        return await send_await_response_transcoded(
            mc,
            SchemaTranscoder(callSchema),
            call_args,
            SchemaTranscoder(Schema.Any)
        );
    },
    async (mc: MessageChannel, responder: LibraryEnvironment) => {
        const data = await receive_transcoded(mc, SchemaTranscoder(callSchema));
        if (data instanceof Error) return;
        const res = await Promise.resolve(responder.implementation.call(data.fn, data.args))
        if (res instanceof Error) return;
        await mc.send(res);
    }
);
