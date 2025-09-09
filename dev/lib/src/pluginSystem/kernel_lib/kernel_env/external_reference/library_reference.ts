import { Effect } from "effect";
import { Address } from "../../../../messaging/base/address";
import { Middleware } from "../../../../messaging/base/middleware";
import { LibraryIdent } from "../../../../pluginSystem/library/library_environment";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";

export class LibraryReference extends ExternalReference {
    readonly library_ident: LibraryIdent;

    constructor(
        readonly address: Address,
        library_ident: LibraryIdent,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void>,
        registerOwnMiddlewareMethod?: (mw: Middleware) => void
    ) {
        super(address, kernel, on_remove, registerOwnMiddlewareMethod);
        this.library_ident = library_ident;
    }

    remove(): Promise<void> {
        const sremove = super.remove.bind(this);
        return Effect.gen(this, function* () {
            // Awaiting response, but ignoreing failure
            yield* this.kernel._send_remove_library_message(this.address).pipe(Effect.ignore);
            yield* Effect.promise(sremove);
        }).pipe(
            Effect.withSpan("LibraryReferenceRemove"),
            Effect.runPromise
        );
    }
}