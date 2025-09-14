import { Effect, Schema } from "effect";
import { ProtocolErrorN } from "../../../../messaging/protocols/base/protocol_errors";
import { ResultToEffect } from "../../../../utils/boundary/run";
import { Json } from "../../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../../common_lib/environments/EnvironmentCommunicationHandler";
import { libraryIdentSchema } from "../../../library/library_environment";
import { LibraryReference } from "../external_reference/library_reference";
import { KernelEnvironment } from "../kernel_env";

export function register_get_library_command(KEV: typeof KernelEnvironment) {
    KEV.add_plugin_command({
        command: "get_library",
        on_command: Effect.fn("get_library")(
            function* (communicator: KernelEnvironment, handler: EnvironmentCommunicationHandler, data: Json) {
                const library_ident = yield* Schema.decodeUnknown(libraryIdentSchema)(data).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Failed to decode library ident",
                        error: e
                    }))
                );


                const res = communicator.get_library(library_ident);
                const library: LibraryReference = yield* ResultToEffect(res).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Callback error creating library",
                        error: e
                    }))
                );

                yield* handler.close({
                    address: library.address.serialize(),
                    library_ident: library.library_ident
                }, true).pipe(
                    Effect.catchAll(e => ProtocolErrorN({
                        message: "Failed to close handler",
                        error: e
                    }))
                );
            })
    })
}