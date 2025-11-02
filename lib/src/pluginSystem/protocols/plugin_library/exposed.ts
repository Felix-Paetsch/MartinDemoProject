import LibraryMessagePartner from "../../plugin_lib/message_partner/library";
import { LibraryEnvironment, libraryIdentSchema } from "../../library/library_environment";
import { Json } from "../../../utils/json";
import { Schema } from "effect";
import MessageChannel from "../../../middleware/channel";
import { Transcoder } from "../../../utils/exports";
import { protocol, Protocol } from "../../../middleware/protocol";

const responseTranscoder = Transcoder.SchemaTranscoder(Schema.Array(Schema.String));

export const get_exposed_protocol: Protocol<LibraryMessagePartner, LibraryEnvironment, null, {
    readonly name: string;
    readonly version: string;
}, Error | readonly string[]> = protocol(
    "get_exposed_library_method",
    LibraryEnvironment.findTranscoder,
    LibraryEnvironment.find,
    async (mc: MessageChannel, initiator: LibraryMessagePartner) => {
        return await mc.next_decoded(responseTranscoder);
    },
    async (mc: MessageChannel, responder: LibraryEnvironment) => {
        const res = await Promise.resolve(responder.implementation.exposes())
        if (res instanceof Error) return;
        await mc.send(res);
    }
);
