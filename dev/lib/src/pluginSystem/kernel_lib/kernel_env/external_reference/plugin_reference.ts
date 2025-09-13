import { PluginIdentWithInstanceId } from "../../../../pluginSystem/plugin_lib/plugin_env/plugin_ident";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";
import { Connection } from "pc-messaging-kernel/messaging/exports";

export class PluginReference extends ExternalReference {
    constructor(
        readonly connection: Connection,
        readonly plugin_ident: PluginIdentWithInstanceId,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve()
    ) {
        super(connection, on_remove);
    }

    remove() {
        const sremove = super.remove.bind(this);
        // this.kernel._send_remove_plugin_message(this.address).pipe(Effect.ignore);
        return sremove();
    }
}