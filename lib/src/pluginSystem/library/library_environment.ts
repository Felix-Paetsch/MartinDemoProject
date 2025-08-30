import { Schema } from "effect";
import { Address } from "../../messaging/base/address";
import { EnvironmentCommunicator } from "../common_lib/env_communication/environment_communicator";
import { Environment } from "../common_lib/messageEnvironments/environment";
import { MPOCommunicationProtocol } from "../plugin_lib/message_partners/base/mpo_commands/mpo_communication/protocol";
import { register_call_command } from "./commands/call";
import { register_exposes_command } from "./commands/exposes";
import { AbstractLibraryImplementation } from "./library_implementation";

export const libraryIdentSchema = Schema.Struct({
    name: Schema.String,
    version: Schema.String
})

export type LibraryIdent = Schema.Schema.Type<typeof libraryIdentSchema>;

export class LibraryEnvironment extends EnvironmentCommunicator {
    constructor(
        readonly env: Environment,
        readonly kernel_address: Address,
        readonly library_ident: LibraryIdent,
        readonly implementation: AbstractLibraryImplementation
    ) {
        super(env);

        const mw = new MPOCommunicationProtocol(env).middleware();
        this.useMiddleware(mw, "listeners");

        register_exposes_command(LibraryEnvironment);
        register_call_command(LibraryEnvironment);
    }
}