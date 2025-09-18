import { LibraryEnvironment, LibraryIdent } from "../../library/library_environment";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";
import { Connection } from "../../../messaging/exports";
import { Protocol } from "../../../middleware/protocol";
import { remove_library_protocol } from "../../protocols/library_kernel/remove_library";

export class LibraryReference extends ExternalReference {
    constructor(
        readonly connection: Connection,
        readonly library_ident: LibraryIdent,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve(),
    ) {
        super(connection, on_remove);
        this.kernel.register_library_middleware(this);
        this.kernel.registered_libraries.push(this);
    }

    async remove() {
        await this.#execute_library_protocol(remove_library_protocol, null);
        await super.remove();
    }

    #execute_library_protocol<Result, InitData>(
        protocol: Protocol<
            LibraryReference,
            LibraryEnvironment,
            InitData,
            LibraryIdent,
            Result
        >,
        initData: InitData
    ) {
        return protocol(
            this,
            this.kernel.port,
            this.connection.address,
            initData,
            this.library_ident
        )
    }
}
