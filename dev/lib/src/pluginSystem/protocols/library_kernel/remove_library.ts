import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { protocol, Protocol, AnythingTranscoder, send_await_response_transcoded, SchemaTranscoder, receive_transcoded, send_transcoded } from "../../../middleware/protocol";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import { findKernel, findLibrary, findPlugin } from "../findResponder";
import MessageChannel from "../../../middleware/channel";
import { libraryIdentSchema } from "../../library/library_environment";
import { LibraryReference } from "../../kernel_lib/external_references/library_reference";
import { LibraryEnvironment } from "../../library/library_environment";

export type GetPluginError = Error;
export const remove_library_protocol = protocol(
    "remove_library",
    SchemaTranscoder(libraryIdentSchema),
    findLibrary,
    async (mc: MessageChannel, initiator: LibraryReference) => {
        return await mc.next()
    },
    async (mc: MessageChannel, responder: LibraryEnvironment) => {
        await responder._trigger_remove_environment();
        mc.send("ok");
    }
);

