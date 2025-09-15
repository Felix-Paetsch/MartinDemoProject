import { EnvironmentCommunicator } from "../common_lib/environments/environment_communicator";
import { LibraryEnvironment, LibraryIdent } from "../library/library_environment";
import { AbstractLibraryImplementation } from "../library/library_implementation";
import { PluginEnvironment } from "../plugin_lib/plugin_environment";
import { PluginIdent, PluginIdentWithInstanceId } from "../plugin_lib/plugin_ident";
import { GetLibraryError } from "../protocols/plugin_kernel/get_library";
import { LibraryReference } from "./external_references/library_reference";
import { PluginReference } from "./external_references/plugin_reference";
import { v4 as uuidv4 } from "uuid";

export type GetPluginError = Error;

export abstract class KernelEnvironment extends EnvironmentCommunicator {
    static singleton: KernelEnvironment | null = null;

    readonly registered_plugins: PluginReference[] = [];
    readonly registered_libraries: LibraryReference[] = [];

    constructor(name: string = "kernel") {
        if (KernelEnvironment.singleton) {
            throw new Error("KernelEnvironment already exists");
        }
        super(name);
        KernelEnvironment.singleton = this;
    }

    get address() { return this.port.address }

    register_plugin_middleware(ref: PluginReference) { }
    register_local_plugin_middleware(env: PluginEnvironment) { }
    register_library_middleware(ref: LibraryReference) { }
    register_local_library_middleware(env: LibraryEnvironment) { }

    start() {
        return this.get_plugin({
            name: "start"
        });
    }

    create_local_plugin_environment(plugin_ident: PluginIdentWithInstanceId) {
        const env = new PluginEnvironment(plugin_ident.instance_id, this.address, plugin_ident);
        const ref = new PluginReference(env.port.connection, plugin_ident, this);
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

        const ref = new LibraryReference(lib.port.connection, library_ident, this);
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

    async create_plugin(plugin_ident: PluginIdent): Promise<PluginReference | GetPluginError> {
        return new Error("Not implemented!");
    }

    async get_library(library_ident: LibraryIdent): Promise<LibraryReference | GetLibraryError> {
        const existingLibrary = this.registered_libraries.find(library => library.library_ident.name === library_ident.name && library.library_ident.version === library_ident.version);
        if (existingLibrary) { return existingLibrary; }

        return await this.create_library(library_ident);
    }

    async create_library(library_ident: LibraryIdent): Promise<LibraryReference | GetLibraryError> {
        return new Error("Not implemented!");
    }
}