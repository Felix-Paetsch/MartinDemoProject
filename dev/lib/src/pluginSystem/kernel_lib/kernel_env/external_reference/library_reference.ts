import { LibraryIdent } from "../../../../pluginSystem/library/library_environment";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";
import { Connection } from "pc-messaging-kernel/messaging/exports";

export class LibraryReference extends ExternalReference {
    constructor(
        readonly connection: Connection,
        readonly library_ident: LibraryIdent,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve(),
    ) {
        super(connection, on_remove);
    }

    remove() {
        const sremove = super.remove.bind(this);
        // this.kernel._send_remove_library_message(this.address);
        return sremove();
    }
}