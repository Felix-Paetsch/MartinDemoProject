import LibraryMessagePartner from "../../plugin_lib/message_partner/library";
import { LibraryEnvironment, libraryIdentSchema } from "../../library/library_environment";
import { Json } from "../../../utils/json";
import { Schema } from "effect";
import MessageChannel from "../../../middleware/channel";
import { Protocol, protocol } from "../../../middleware/protocol";
import { Transcoder } from "../../../utils/exports";

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
        return await mc.send_await_next_transcoded(
            Transcoder.SchemaTranscoder(callSchema),
            call_args,
            Transcoder.SchemaTranscoder(Schema.Any)
        );
    },
    async (mc: MessageChannel, responder: LibraryEnvironment) => {
        const data = await mc.next_decoded(Transcoder.SchemaTranscoder(callSchema));
        if (data instanceof Error) return;
        const res = await Promise.resolve(responder.implementation.call(data.fn, data.args))
        if (res instanceof Error) return;
        await mc.send(res);
    }
);
