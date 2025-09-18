import { EnvironmentCommunicator } from "../common_lib/environments/environment_communicator";
import { LibraryEnvironment, LibraryIdent } from "../library/library_environment";
import { AbstractLibraryImplementation } from "../library/library_implementation";
import { PluginEnvironment } from "../plugin_lib/plugin_environment";
import { PluginIdent, PluginIdentWithInstanceId } from "../plugin_lib/plugin_ident";
import { GetLibraryError } from "../protocols/plugin_kernel/get_library";
import { LibraryReference } from "./external_references/library_reference";
import { PluginReference } from "./external_references/plugin_reference";
import uuidv4 from "../../utils/uuid";
import { Json } from "../../messaging/core/message";
import { Address } from "../../messaging/exports";

export type GetPluginError = Error;

export abstract class KernelEnvironment extends EnvironmentCommunicator {
    static singleton: KernelEnvironment | null = null;

    readonly registered_plugins: PluginReference[] = [];
    readonly registered_libraries: LibraryReference[] = [];

    constructor() {
        if (KernelEnvironment.singleton) {
            throw new Error("KernelEnvironment already exists");
        }
        super("kernel");
        KernelEnvironment.singleton = this;
        this.register_kernel_middleware(this);
    }

    get address() { return this.port.address }

    register_kernel_middleware(ker: this) { }
    register_local_plugin_middleware(env: PluginEnvironment) { }
    register_local_library_middleware(env: LibraryEnvironment) { }

    start() {
        return this.get_plugin({
            name: "start"
        });
    }

    create_local_plugin_environment(plugin_ident: PluginIdentWithInstanceId) {
        const env = new PluginEnvironment(Address.process_id, plugin_ident);
        const ref = new PluginReference(env.address, plugin_ident, this);
        this.register_local_plugin_middleware(env);

        return {
            ref: ref,
            env: env
        };
    }

    create_local_library_environment(library_ident: LibraryIdent, implementation: AbstractLibraryImplementation, port_id: string = uuidv4()): {
        ref: LibraryReference, env: LibraryEnvironment
    } {
        const lib = new LibraryEnvironment(port_id, this.address, library_ident, implementation);
        this.register_local_library_middleware(lib);

        const ref = new LibraryReference(lib.address, library_ident, this);
        return {
            ref: ref,
            env: lib
        };
    }

    async get_plugin(plugin_ident: PluginIdent): Promise<PluginReference | GetPluginError> {
        const existingPlugin = this.registered_plugins.find(plugin => plugin.plugin_ident.name === plugin_ident.name);
        if (existingPlugin) { return existingPlugin; }

        return await this.create_plugin(plugin_ident);
    }

    get_plugin_reference(ident: string | Address | PluginIdentWithInstanceId | PluginReference): PluginReference | null {
        if (ident instanceof PluginReference) {
            return ident;
        }

        if (ident instanceof Address) {
            return this.registered_plugins.find(p => p.address.equals(ident)) || null;
        }

        if (typeof ident === "string") {
            return this.registered_plugins.find(p => p.plugin_ident.instance_id === ident) || null;
        }

        return this.get_plugin_reference(ident.instance_id);
    }

    async create_plugin(plugin_ident: PluginIdent): Promise<PluginReference | GetPluginError> {
        return new Error("Not implemented!");
    }

    async get_library(library_ident: LibraryIdent): Promise<LibraryReference | GetLibraryError> {
        const existingLibrary = this.registered_libraries.find(library => library.library_ident.name === library_ident.name && library.library_ident.version === library_ident.version);
        if (existingLibrary) { return existingLibrary; }

        return await this.create_library(library_ident);
    }
    get_library_reference(ident: Address | LibraryReference | LibraryIdent): null | LibraryReference {
        if (ident instanceof LibraryReference) {
            return ident;
        }
        if (ident instanceof Address) {
            return this.registered_libraries.find(l => l.address.equals(ident)) || null;
        }
        return this.registered_libraries.find(l => {
            return l.library_ident.name == ident.name
        }) || null;
    }
    async create_library(library_ident: LibraryIdent): Promise<LibraryReference | GetLibraryError> {
        return new Error("Not implemented!");
    }
    async remove_library(l: LibraryReference) {
        await l.remove();
        const index = this.registered_libraries.findIndex(m => m == l);
        if (index < 0) return;
        this.registered_libraries.splice(index, 1);
    }

    async remove_plugin(p: PluginReference) {
        await p.remove();
        const index = this.registered_plugins.findIndex(q => q.plugin_ident.instance_id !== p.plugin_ident.instance_id);
        if (index < 0) return;
        this.registered_plugins.splice(index, 1);
    }

    // The boolean says if we processed this message already (true)
    async recieve_plugin_message(msg: Json, plugin: PluginIdentWithInstanceId): Promise<boolean> {
        if (msg === "remove_self") {
            const ref = this.get_plugin_reference(plugin);
            if (ref) await this.remove_plugin(ref);
            return true;
        }
        return false;
    }
 }
