import { PluginIdentWithInstanceId } from "../../plugin_lib/plugin_ident";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";
import { Address } from "../../../messaging/exports";
import PluginMessagePartner from "../../plugin_lib/message_partner/plugin_message_partner";
import { Protocol } from "../../../middleware/protocol";
import { remove_plugin_protocol } from "../../protocols/plugin_kernel/remove_plugin";
import { type PluginEnvironment } from "../../plugin_lib/plugin_environment";

export class PluginReference extends ExternalReference {
    constructor(
        readonly address: Address,
        readonly plugin_ident: PluginIdentWithInstanceId,
        readonly kernel: KernelEnvironment,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve()
    ) {
        super(address, on_remove);
        this.kernel.registered_plugins.push(this);
    }

    async remove() {
        await this.#execute_plugin_protocol(remove_plugin_protocol, null);
        await super.remove();
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
            this.address,
            initData,
            this.plugin_ident
        )
    }
}
