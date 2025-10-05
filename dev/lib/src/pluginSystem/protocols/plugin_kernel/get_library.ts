import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { protocol } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import MessageChannel from "../../../middleware/channel";
import { Schema } from "effect";
import { AddressFromString } from "../../../messagingEffect/schemas";
import { libraryIdentSchema, LibraryIdent } from "../../library/library_environment";
import LibraryMessagePartner from "../../plugin_lib/message_partner/library";
import uuidv4 from "../../../utils/uuid";
import { Transcoder } from "../../../utils/exports";

const libraryData = Schema.Struct({
    address: AddressFromString,
    library_ident: libraryIdentSchema,
    uuid: Schema.String
})

export type GetLibraryError = Error;
export const get_library = protocol(
    "get_library",
    KernelEnvironment.findTranscoder,
    KernelEnvironment.find,
    async (mc: MessageChannel, initiator: PluginEnvironment, library_ident: LibraryIdent) => {
        const res = await mc.send_await_next_transcoded(
            Transcoder.SchemaTranscoder(libraryIdentSchema),
            library_ident,
            Transcoder.SchemaTranscoder(libraryData)
        );

        if (res instanceof Error) return res;
        return new LibraryMessagePartner({
            address: res.address,
            library_ident: res.library_ident
        }, initiator, res.uuid);
    },
    async (mc: MessageChannel, responder: KernelEnvironment) => {
        const data = await mc.next_decoded(Transcoder.SchemaTranscoder(libraryIdentSchema));
        if (data instanceof Error) return;
        const library = await responder.get_library(data);
        if (library instanceof Error) return;
        await mc.send_encoded(
            Transcoder.SchemaTranscoder(libraryData), {
            address: library.address,
            library_ident: library.library_ident,
            uuid: uuidv4()
        });
    },
);
