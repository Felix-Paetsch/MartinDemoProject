import { Address } from "../../../../messaging/base/address";
import { Middleware } from "../../../../messaging/base/middleware";
import { LibraryIdent } from "../../../../pluginSystem/plugin_lib/message_partners/library";
import { Result, ResultPromise } from "../../../../utils/boundary/result";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";

export class LibraryReference extends ExternalReference {
    readonly library_ident: LibraryIdent;

    constructor(
        readonly address: Address,
        library_ident: LibraryIdent,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Result<void, Error> | ResultPromise<void, Error> | Promise<void>,
        registerOwnMiddlewareMethod?: (mw: Middleware) => void
    ) {
        super(address, kernel, on_remove, registerOwnMiddlewareMethod);
        this.library_ident = library_ident;
    }
}