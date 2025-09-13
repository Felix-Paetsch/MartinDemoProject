import { Schema } from "effect";
import { Address, Port } from "../../messaging/exports";
import { AbstractLibraryImplementation } from "./library_implementation";
import { EnvironmentCommunicator } from "../common_lib/environments/environment_communicator";

export const libraryIdentSchema = Schema.Struct({
    name: Schema.String,
    version: Schema.String
})

export type LibraryIdent = Schema.Schema.Type<typeof libraryIdentSchema>;

export class LibraryEnvironment extends EnvironmentCommunicator {
    constructor(
        readonly port_id: string,
        readonly kernel_address: Address,
        readonly library_ident: LibraryIdent,
        readonly implementation: AbstractLibraryImplementation
    ) {
        super(port_id);
    }
}

// register_exposes_command(LibraryEnvironment);
// register_call_command(LibraryEnvironment);
// register_remove_library_command(LibraryEnvironment);
