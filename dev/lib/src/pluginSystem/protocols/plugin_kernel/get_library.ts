import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { protocol, receive_transcoded, SchemaTranscoder, send_await_response_transcoded, send_transcoded, AnythingTranscoder } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import MessageChannel from "../../../middleware/channel";
import { Schema } from "effect";
import { AddressFromString } from "../../../messagingEffect/schemas";
import { libraryIdentSchema, LibraryIdent } from "../../library/library_environment";
import LibraryMessagePartner from "../../plugin_lib/message_partner/library";
import uuidv4 from "../../../utils/uuid";

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
        const res = await send_await_response_transcoded(
            mc,
            SchemaTranscoder(libraryIdentSchema),
            library_ident,
            SchemaTranscoder(libraryData)
        );

        if (res instanceof Error) return res;
        return new LibraryMessagePartner({
            address: res.address,
            library_ident: res.library_ident
        }, initiator, res.uuid);
    },
    async (mc: MessageChannel, responder: KernelEnvironment) => {
        const data = await receive_transcoded(mc, SchemaTranscoder(libraryIdentSchema));
        if (data instanceof Error) return;
        const library = await responder.get_library(data);
        if (library instanceof Error) return;
        await send_transcoded(mc, SchemaTranscoder(libraryData), {
            address: library.address,
            library_ident: library.library_ident,
            uuid: uuidv4()
        });
    },
);
