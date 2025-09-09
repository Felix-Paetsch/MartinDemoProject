import { Effect } from "effect";
import { v4 as uuidv4 } from "uuid";
import { Address } from "../../../../messaging/base/address";
import { Middleware } from "../../../../messaging/base/middleware";
import { PluginIdent, PluginIdentWithInstanceId } from "../../../../pluginSystem/plugin_lib/plugin_env/plugin_ident";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";

export class PluginReference extends ExternalReference {
    readonly plugin_ident: PluginIdentWithInstanceId;

    constructor(
        readonly address: Address,
        plugin_ident: PluginIdent,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void>,
        registerOwnMiddlewareMethod?: (mw: Middleware) => void
    ) {
        super(address, kernel, on_remove, registerOwnMiddlewareMethod);
        this.plugin_ident = {
            instance_id: uuidv4(),
            ...plugin_ident
        };
    }

    remove(): Promise<void> {
        const sremove = super.remove.bind(this);
        return Effect.gen(this, function* () {
            // Awaiting response, but ignoreing failure
            yield* this.kernel._send_remove_plugin_message(this.address).pipe(Effect.ignore);
            yield* Effect.promise(sremove);
        }).pipe(
            Effect.withSpan("PluginReferenceRemove"),
            Effect.runPromise
        );
    }
}