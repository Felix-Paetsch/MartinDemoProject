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
    static libraries: LibraryEnvironment[] = [];
    constructor(
        readonly port_id: string,
        readonly kernel_address: Address,
        readonly library_ident: LibraryIdent,
        readonly implementation: AbstractLibraryImplementation
    ) {
        super(port_id);
        LibraryEnvironment.libraries.push(this);
    }

    async _trigger_remove_environment() {
        LibraryEnvironment.libraries = LibraryEnvironment.libraries.filter(l => l !== this);
        await this.implementation.dispose();
    }
}
