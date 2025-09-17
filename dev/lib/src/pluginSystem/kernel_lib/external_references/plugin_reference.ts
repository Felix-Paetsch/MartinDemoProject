import { PluginIdentWithInstanceId } from "../../plugin_lib/plugin_ident";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";
import { Connection } from "../../../messaging/exports";
import PluginMessagePartner from "../../plugin_lib/message_partner/plugin_message_partner";
import { Protocol } from "../../../middleware/protocol";
import { PluginEnvironment } from "../../../_pluginSystem/plugin_lib/exports";
import { remove_plugin_protocol } from "../../protocols/plugin_kernel/remove_plugin";

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

    async remove() {
        await this.#execute_plugin_protocol(remove_plugin_protocol, null);
        await super.remove.bind(this);
    }

    #execute_plugin_protocol<Result, InitData>(
        protocol: Protocol<
            PluginReference,
            PluginEnvironment,
            InitData,
            PluginIdentWithInstanceId,
            Result
        >,
        initData: InitData
    ) {
        return protocol(
            this,
            this.kernel.port,
            this.connection.address,
            initData,
            this.plugin_ident
        )
    }
}
