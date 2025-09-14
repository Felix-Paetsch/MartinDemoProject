import { PluginIdentWithInstanceId } from "../../plugin_lib/plugin_ident";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";
import { Connection } from "../../../messaging/exports";

export class PluginReference extends ExternalReference {
    constructor(
        readonly connection: Connection,
        readonly plugin_ident: PluginIdentWithInstanceId,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve()
    ) {
        super(connection, on_remove);
        this.kernel.register_plugin_middleware(this);
        this.kernel.registered_plugins.push(this);
    }

    remove() {
        const sremove = super.remove.bind(this);
        return sremove();
    }
}