import { Effect } from "effect";
import { EnvironmentCommunicationHandler } from "../../common_lib/environments/EnvironmentCommunicationHandler";
import { LibraryEnvironment } from "../library_environment";
import { callbackToEffect } from "../../../utils/boundary/callbacks";

export function register_remove_library_command(PEC: typeof LibraryEnvironment) {
    PEC.add_kernel_command({
        command: "remove_library",
        on_command: Effect.fn("remove library")(
            function* (
                lib: LibraryEnvironment,
                handler: EnvironmentCommunicationHandler,
            ) {
                yield* callbackToEffect(lib.implementation.dispose.bind(lib.implementation)).pipe(Effect.ignore);
                yield* handler.close({ success: true }, true);
            }
        )
    })
}