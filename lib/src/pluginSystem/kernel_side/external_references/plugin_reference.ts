import { PluginIdentWithInstanceId } from "../../plugin_side/plugin_ident";
import { KernelEnvironment } from "../kernel_env";
import { ExternalReference } from "./external_reference";
import { Address, Json } from "../../../messaging/exports";
import { Protocol } from "../../../middleware/protocol";
import { remove_plugin_protocol } from "../../protocols/plugin_kernel/remove_plugin";
import { type PluginEnvironment } from "../../plugin_side/plugin_environment";

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
        await this.#execute_plugin_protocol(remove_plugin_protocol, null, null);
        await super.remove();
    }

    #execute_plugin_protocol<Result, InitiatorInitData, ResponderInitData extends Json>(
        protocol: Protocol<
            PluginReference,
            PluginEnvironment,

            InitiatorInitData,
            ResponderInitData,
            PluginIdentWithInstanceId,
            Result
        >,
        initiatorInitData: InitiatorInitData,
        responderInitData: ResponderInitData
    ) {
        return protocol(
            this,
            this.kernel.port,
            this.address,
            initiatorInitData,
            responderInitData,
            this.plugin_ident
        )
    }
}
