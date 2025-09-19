import { protocol, Protocol, AnythingTranscoder, send_await_response_transcoded, SchemaTranscoder, receive_transcoded, send_transcoded } from "../../../middleware/protocol";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import MessageChannel from "../../../middleware/channel";
import { LibraryReference } from "../../kernel_lib/external_references/library_reference";
import { LibraryEnvironment } from "../../library/library_environment";

export type GetPluginError = Error;
export const remove_library_protocol = protocol(
    "remove_library",
    LibraryEnvironment.findTranscoder,
    LibraryEnvironment.find,
    async (mc: MessageChannel, initiator: LibraryReference) => {
        return await mc.next()
    },
    async (mc: MessageChannel, responder: LibraryEnvironment) => {
        await responder._trigger_remove_environment();
        mc.send("ok");
    }
);

