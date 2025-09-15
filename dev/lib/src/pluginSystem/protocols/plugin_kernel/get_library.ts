import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { Protocol, registerProtocol } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import { findKernel } from "../findResponder";
import MessageChannel from "../../../middleware/channel";
import { Effect, Schema } from "effect";
import { AddressFromString } from "../../../messagingEffect/schemas";
import { failOnError } from "../../../messagingEffect/utils";
import { libraryIdentSchema, LibraryIdent } from "../../library/library_environment";
import LibraryMessagePartner from "../../plugin_lib/message_partner/library";

const libraryData = Schema.Struct({
    address: AddressFromString,
    library_ident: libraryIdentSchema
})

export type GetLibraryError = Error;
export const get_library: Protocol<
    PluginEnvironment,
    KernelEnvironment,
    LibraryMessagePartner | GetLibraryError,
    LibraryIdent,
    null
> = {
    name: "get_library",
    initiate: async (mc: MessageChannel, initiator: PluginEnvironment, library_ident: LibraryIdent) => {
        return Effect.gen(function* () {
            yield* Effect.promise(() => mc.send(library_ident)).pipe(failOnError);
            const libData = yield* Effect.promise(() => mc.next()).pipe(failOnError);
            const res = yield* Schema.decodeUnknown(libraryData)(libData);
            if (res instanceof Error) return res;
            return new LibraryMessagePartner(res, initiator);
        }).pipe(
            Effect.merge,
            Effect.runPromise
        )
    },
    respond: async (mc: MessageChannel, responder: KernelEnvironment) => {
        await Effect.gen(function* () {
            const data = yield* Effect.promise(() => mc.next()).pipe(failOnError);
            const library_ident = yield* Schema.decodeUnknown(libraryIdentSchema)(data);
            const library = yield* Effect.promise(() => responder.get_library(library_ident)).pipe(failOnError);
            const library_data = yield* Schema.encode(libraryData)({
                address: library.address,
                library_ident: library.library_ident
            });
            yield* Effect.promise(() => mc.send(library_data)).pipe(failOnError);
        }).pipe(
            Effect.merge,
            Effect.runPromise
        )
    },
    findResponder: findKernel
}

registerProtocol(get_library);
