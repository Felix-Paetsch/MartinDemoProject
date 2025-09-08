import { Effect, Equal } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { Address } from "../../../messaging/base/address";
import { Middleware } from "../../../messaging/base/middleware";
import { ProtocolError } from "../../../messaging/protocols/base/protocol_errors";
import { LibraryEnvironment, LibraryIdent } from "../../../pluginSystem/library/library_environment";
import { AbstractLibraryImplementation } from "../../../pluginSystem/library/library_implementation";
import { Failure, ResultPromise, Success } from "../../../utils/boundary/result";
import { EffectToResult } from "../../../utils/boundary/run";
import { Json } from "../../../utils/json";
import { EnvironmentCommunicator } from "../../common_lib/env_communication/environment_communicator";
import { Environment } from "../../common_lib/messageEnvironments/environment";
import { KernelEnv } from "../../common_lib/messageEnvironments/kernelEnvironment";
import { createLocalEnvironment } from "../../common_lib/messageEnvironments/localEnvironment";
import { PluginEnvironment } from "../../plugin_lib/plugin_env/plugin_env";
import { PluginIdent, PluginIdentWithInstanceId } from "../../plugin_lib/plugin_env/plugin_ident";
import { register_get_library_command } from "./commands/get_library";
import { register_get_plugin_command as register_kernel_get_plugin_command } from "./commands/get_plugin";
import { register_kernel_message_command } from "./commands/kernel_message";
import { _send_remove_plugin_message, register_remove_plugin_command as register_kernel_remove_plugin_command } from "./commands/remove_plugin";
import { LibraryReference } from "./external_reference/library_reference";
import { PluginReference } from "./external_reference/plugin_reference";

export abstract class KernelEnvironment extends EnvironmentCommunicator {
    private registered_plugins: PluginReference[] = [];
    private registered_libraries: LibraryReference[] = [];

    constructor(
        readonly env: Environment = KernelEnv
    ) {
        super(env);
        this.command_prefix = "KERNEL";
        this.register_kernel_middleware();
    }

    get address() {
        return this.env.ownAddress;
    }

    register_kernel_middleware(): void { }
    register_plugin_middleware(ref: PluginReference): void { }
    register_local_plugin_middleware(env: PluginEnvironment): void { }
    register_library_middleware(ref: LibraryReference): void { }
    register_local_library_middleware(env: LibraryEnvironment): void { }

    use_middleware(middleware: Middleware): Promise<void> {
        return this.env.useMiddleware(middleware).pipe(
            Effect.runPromise
        );
    }

    start() {
        return this.get_plugin({
            name: "start"
        })
    }

    create_local_plugin_environment(plugin_ident: PluginIdent, address: Address = Address.new_local_address("PLUGIN_" + uuidv4())): ResultPromise<{
        env: PluginEnvironment,
        ref: PluginReference
    }, Error> {
        return Effect.gen(this, function* () {
            const Lenv = yield* createLocalEnvironment(address);
            const uuid = uuidv4();
            const ident = {
                instance_id: uuid,
                ...plugin_ident
            }

            const plugin_env = new PluginEnvironment(Lenv, this.address, ident);
            const ref = new PluginReference(
                address,
                ident,
                this,
                plugin_env.remove_self.bind(plugin_env),
                (mw: Middleware) => Lenv.useSendMiddleware(mw).pipe(Effect.runSync)
            )

            return {
                env: plugin_env,
                ref: ref
            }
        }).pipe(
            Effect.withSpan("KernelCreateLocalPluginEnvironment"),
            EffectToResult
        );
    }

    get_plugin(plugin_ident: PluginIdent): ResultPromise<PluginReference, Error> {
        const existingPlugin = this.registered_plugins.find(plugin => plugin.plugin_ident.instance_id === plugin_ident.instance_id);
        if (existingPlugin) {
            return Success.promise(existingPlugin);
        }
        if (plugin_ident.instance_id) {
            return Failure.promise(new Error("Plugin instance id not found"))
        }

        return this.create_plugin(
            plugin_ident
        ).then(res => {
            if (res.is_error) return res;
            this.registered_plugins.push(res.value);
            return res;
        });
    }

    get_plugin_reference(
        plugin_ident: PluginIdent | PluginReference | string | Address
    ): PluginReference | null {
        if (typeof plugin_ident === "string") {
            return this.registered_plugins.find(plugin => plugin.plugin_ident.instance_id === plugin_ident) || null;
        }
        if (plugin_ident instanceof PluginReference) {
            return this.get_plugin_reference(plugin_ident.plugin_ident);
        }
        if (plugin_ident instanceof PluginReference) {
            return plugin_ident;
        }
        if (plugin_ident instanceof Address) {
            for (const ref of this.registered_plugins) {
                if (Equal.equals(ref.address, plugin_ident)) {
                    return ref;
                }
            }
        }
        return null;
    }

    create_plugin(plugin_ident: PluginIdent): ResultPromise<PluginReference, Error> {
        return Failure.promise(new Error("Create plugin not implemented"))
    };

    async remove_plugin(ref: PluginReference): Promise<void> {
        await ref.remove();
        const index = this.registered_plugins.findIndex(plugin => plugin.plugin_ident.instance_id === ref.plugin_ident.instance_id);
        if (index !== -1) {
            this.registered_plugins.splice(index, 1);
        }
    }

    get_library(library_ident: LibraryIdent): ResultPromise<LibraryReference, Error> {
        const existingLibrary = this.registered_libraries.find(plugin => plugin.library_ident.name === library_ident.name && plugin.library_ident.version === library_ident.version);
        if (existingLibrary) {
            return Success.promise(existingLibrary);
        }

        return this.create_library(
            library_ident
        ).then(res => {
            if (res.is_error) return res;
            this.registered_libraries.push(res.value);
            return res;
        });
    }

    get_library_reference(
        library_ident: LibraryIdent | LibraryReference | string | Address
    ): LibraryReference | null {
        if (typeof library_ident === "string") {
            return this.registered_libraries.find(lib => lib.library_ident.name === library_ident) || null;
        }
        if (library_ident instanceof LibraryReference) {
            return this.get_library_reference(library_ident.library_ident);
        }
        if (library_ident instanceof Address) {
            for (const ref of this.registered_libraries) {
                if (Equal.equals(ref.address, library_ident)) {
                    return ref;
                }
            }
        }
        return null;
    }

    create_library(library_ident: LibraryIdent): ResultPromise<LibraryReference, Error> {
        return Failure.promise(new Error("Create library not implemented"))
    };

    async remove_library(ref: LibraryReference): Promise<void> {
        await ref.remove();
        const index = this.registered_libraries.findIndex(plugin => plugin.library_ident.name === ref.library_ident.name && plugin.library_ident.version === ref.library_ident.version);
        if (index !== -1) {
            this.registered_libraries.splice(index, 1);
        }
    }

    create_local_library(library_ident: LibraryIdent, implementation: AbstractLibraryImplementation): ResultPromise<LibraryReference, Error> {
        return Effect.gen(this, function* () {
            const Lenv = yield* createLocalEnvironment(Address.new_local_address("LIB_" + uuidv4()));

            const lib = new LibraryEnvironment(Lenv, this.address, library_ident, implementation);
            this.register_local_library_middleware(lib);
            const ref = new LibraryReference(
                Lenv.ownAddress,
                library_ident,
                this,
                () => Lenv.remove.pipe(Effect.runPromise),
                (mw: Middleware) => Lenv.useSendMiddleware(mw).pipe(Effect.runSync)
            )

            return ref;
        }).pipe(
            Effect.withSpan("KernelCreateLocalLibrary"),
            EffectToResult
        );
    }

    on_kernel_message(command: string, data: any, plugin_ident: PluginIdentWithInstanceId) { }

    _send_remove_plugin_message(address: Address, data?: Json): Effect.Effect<void, ProtocolError> {
        return _send_remove_plugin_message.call(this, address, data);
    };
}

register_kernel_get_plugin_command(KernelEnvironment);
register_kernel_message_command(KernelEnvironment);
register_kernel_remove_plugin_command(KernelEnvironment);
register_get_library_command(KernelEnvironment);