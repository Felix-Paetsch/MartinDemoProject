import { Severity } from "../debug/severity";
import { Address } from "../../messaging/exports";
import { Json } from "../../utils/json";
import { EnvironmentCommunicator } from "../common_lib/environments/environment_communicator";
import PluginMessagePartner from "./message_partner/plugin_message_partner";
import { PluginIdent, PluginIdentWithInstanceId } from "./plugin_ident";
import { KernelEnvironment } from "../kernel_lib/kernel_env";
import { Protocol } from "../../middleware/protocol";
import { get_plugin_from_kernel, make_plugin_message_partner } from "../protocols/plugin_kernel/get_plugin";
import { LibraryIdent } from "../library/library_environment";
import LibraryMessagePartner from "./message_partner/library";
import { get_library } from "../protocols/plugin_kernel/get_library";
import { Logging } from "../../messaging/exports"

export type PluginDescriptor = {
    address: Address;
    plugin_ident: PluginIdentWithInstanceId;
}

export class PluginEnvironment extends EnvironmentCommunicator {
    static plugins: PluginEnvironment[] = [];
    readonly plugin_message_partners: PluginMessagePartner[] = [];
    readonly library_message_partners: LibraryMessagePartner[] = [];
    constructor(
        readonly port_id: string,
        readonly kernel_address: Address,
        readonly plugin_ident: PluginIdentWithInstanceId
    ) {
        super(port_id);
        PluginEnvironment.plugins.push(this);
    }

    log(data: Json, severity: Severity = Severity.INFO) {
        return Logging.log({
            data,
            severity
        });
    }

    async get_library(library_ident: LibraryIdent): Promise<LibraryMessagePartner | Error> {
        return await this.#execute_kernel_protocol(
            get_library,
            library_ident
        );
    }

    async get_plugin(plugin_ident: PluginIdent): Promise<PluginMessagePartner | Error> {
        const res = await this.#execute_kernel_protocol(get_plugin_from_kernel, plugin_ident);
        if (res instanceof Error) return res;
        return await this.#execute_plugin_protocol(
            make_plugin_message_partner, res, {
            address: res.address,
            plugin_ident: res.plugin_ident
        });
    }
    private on_plugin_request_cb: (mp: PluginMessagePartner) => Promise<void> = () => Promise.resolve();
    on_plugin_request(cb: (mp: PluginMessagePartner) => void | Promise<void>): void {
        this.on_plugin_request_cb = (mp: PluginMessagePartner) => Promise.resolve(cb(mp));
    };
    async _trigger_on_plugin_request(mp: PluginMessagePartner, data?: Json): Promise<void | Error> {
        try {
            return await this.on_plugin_request_cb(mp).catch(e => e);
        } catch (e) {
            return e as Error;
        }
    };

    #execute_kernel_protocol<Result, InitData>(
        protocol: Protocol<
            PluginEnvironment,
            KernelEnvironment,
            InitData,
            null,
            Result
        >,
        initData: InitData
    ): Promise<Result | Error> {
        return protocol(
            this,
            this.port,
            this.kernel_address,
            initData,
            null
        );
    }

    #execute_plugin_protocol<Result, InitData>(
        protocol: Protocol<
            PluginEnvironment,
            PluginEnvironment,
            InitData,
            PluginIdentWithInstanceId,
            Result
        >,
        pluginDescriptor: PluginDescriptor,
        initData: InitData
    ): Promise<Result | Error> {
        return protocol(
            this,
            this.port,
            pluginDescriptor.address,
            initData,
            pluginDescriptor.plugin_ident
        );
    }
}
