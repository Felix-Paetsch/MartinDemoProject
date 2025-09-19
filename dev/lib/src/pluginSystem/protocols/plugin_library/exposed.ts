
import { Protocol, protocol, receive_transcoded, SchemaTranscoder, send_await_response_transcoded } from "../../../middleware/protocol";
import LibraryMessagePartner from "../../plugin_lib/message_partner/library";
import { LibraryEnvironment, libraryIdentSchema } from "../../library/library_environment";
import { Json } from "../../../utils/json";
import { Schema } from "effect";
import MessageChannel from "../../../middleware/channel";

const responseTranscoder = SchemaTranscoder(Schema.Array(Schema.String));

export const get_exposed_protocol: Protocol<LibraryMessagePartner, LibraryEnvironment, null, {
    readonly name: string;
    readonly version: string;
}, Error | readonly string[]> = protocol(
    "get_exposed_library_method",
    LibraryEnvironment.findTranscoder,
    LibraryEnvironment.find,
    async (mc: MessageChannel, initiator: LibraryMessagePartner) => {
        return await receive_transcoded(mc, responseTranscoder);
    },
    async (mc: MessageChannel, responder: LibraryEnvironment) => {
        const res = await Promise.resolve(responder.implementation.exposes())
        if (res instanceof Error) return;
        await mc.send(res);
    }
);
