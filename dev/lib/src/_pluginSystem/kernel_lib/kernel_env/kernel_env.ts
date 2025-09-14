import { Equal } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { Address } from "../../../messaging/core/address";
/*import { LibraryEnvironment, LibraryIdent } from "../../../pluginSystem/library/library_environment";
import { AbstractLibraryImplementation } from "../../../pluginSystem/library/library_implementation"; */
import { Failure, ResultPromise, Success } from "../../../utils/boundary/result";
import { EnvironmentCommunicator } from "../../common_lib/environments/environment_communicator";
import { PluginEnvironment } from "../../plugin_lib/plugin_env/plugin_env";
import { PluginIdent, PluginIdentWithInstanceId } from "../../plugin_lib/plugin_env/plugin_ident";
import { LibraryReference } from "./external_reference/library_reference";
import { PluginReference } from "./external_reference/plugin_reference";

export abstract class KernelEnvironment extends EnvironmentCommunicator {
    private registered_plugins: PluginReference[] = [];
    private registered_libraries: LibraryReference[] = [];

    constructor(name: string = "kernel") {
        super(name);
    }

    register_kernel_middleware(): void { }
    register_plugin_middleware(ref: PluginReference): void { }
    register_local_plugin_middleware(env: PluginEnvironment): void { }
    register_library_middleware(ref: LibraryReference): void { }
    register_local_library_middleware(env: LibraryEnvironment): void { }

    start() {
        return this.get_plugin({
            name: "start"
        })
    }

    create_local_plugin_environment(plugin_ident: PluginIdentWithInstanceId) {
        // Errors: AddressAlreadyInUseError
        const env = new PluginEnvironment(plugin_ident.instance_id, this.address, plugin_ident);

        return {
            ref: new PluginReference(env.port.connection, plugin_ident, this),
            env: env,
        }
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

    create_local_library(library_ident: LibraryIdent, implementation: AbstractLibraryImplementation, port_id: string = uuidv4()): LibraryReference {
        // Errors: AddressAlreadyInUseError
        const lib = new LibraryEnvironment(port_id, this.address, library_ident, implementation);
        this.register_local_library_middleware(lib);

        const ref = new LibraryReference(lib.port.connection, library_ident, this);
        return ref;
    }
}

//  register_kernel_get_plugin_command(KernelEnvironment);
//	register_kernel_message_command(KernelEnvironment);
//  register_kernel_remove_plugin_command(KernelEnvironment);
//  register_get_library_command(KernelEnvironment);