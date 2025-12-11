import { EnvironmentCommunicator } from "../common/environments/environment_communicator";
import { PluginEnvironment } from "../plugin_side/plugin_environment";
import { PluginIdent, PluginIdentWithInstanceId } from "../plugin_side/plugin_ident";
import { PluginReference } from "./external_references/plugin_reference";
import { Json } from "../../messaging/core/message";
import { Address } from "../../messaging/exports";
import { AnythingTranscoder } from "../../utils/transcoder";

export type GetPluginError = Error;

export abstract class KernelEnvironment extends EnvironmentCommunicator {
    static singleton: KernelEnvironment | null = null;

    readonly registered_plugins: PluginReference[] = [];

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

    start() {
        return this.get_plugin({
            name: "root"
        });
    }

    create_local_plugin_environment(plugin_ident: PluginIdentWithInstanceId) {
        const env = new PluginEnvironment(Address.process_id, plugin_ident); const ref = new PluginReference(env.address, plugin_ident, this);
        this.register_local_plugin_middleware(env);

        return {
            ref: ref,
            env: env
        };
    }

    async get_plugin(plugin_ident: PluginIdent): Promise<PluginReference | GetPluginError> {
        const existingPlugin = this.registered_plugins.find(plugin => plugin.plugin_ident.instance_id === plugin_ident.instance_id);
        if (existingPlugin) { return existingPlugin; }

        return await this.create_plugin(plugin_ident);
    }

    get_plugin_reference(ident: null | string | Address | PluginIdentWithInstanceId | PluginReference): PluginReference | null {
        if (!ident) return null;
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

    abstract create_plugin(plugin_ident: PluginIdent): Promise<PluginReference | GetPluginError>

    async remove_plugin(p: PluginReference) {
        await p.remove();
        const index = this.registered_plugins.findIndex(q => q.plugin_ident.instance_id === p.plugin_ident.instance_id);
        if (index < 0) return;
        this.registered_plugins.splice(index, 1);
    }

    // The boolean says if we processed this message already (true)
    async receive_plugin_message(msg: Json, plugin: PluginIdentWithInstanceId): Promise<boolean> {
        if (msg === "remove_self") {
            const ref = this.get_plugin_reference(plugin);
            if (ref) await this.remove_plugin(ref);
            return true;
        }
        return false;
    }

    static find() {
        return KernelEnvironment.singleton;
    }

    static get findTranscoder() {
        return AnythingTranscoder
    }
}
