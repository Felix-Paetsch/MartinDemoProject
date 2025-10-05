import { Severity } from "../debug/severity";
import { Address } from "../../messaging/exports";
import { Json } from "../../utils/json";
import { EnvironmentCommunicator } from "../common_lib/environments/environment_communicator";
import PluginMessagePartner from "./message_partner/plugin_message_partner";
import { PluginIdent, PluginIdentWithInstanceId, pluginIdentWithInstanceIdSchema } from "./plugin_ident";
import { KernelEnvironment } from "../kernel_lib/kernel_env";
import { get_plugin_from_kernel, make_plugin_message_partner } from "../protocols/plugin_kernel/get_plugin";
import { LibraryIdent } from "../library/library_environment";
import LibraryMessagePartner from "./message_partner/library";
import { get_library } from "../protocols/plugin_kernel/get_library";
import { Logging } from "../../messaging/exports"
import { send_kernel_message } from "../protocols/plugin_kernel/kernel_message";
import { Schema } from "effect";
import { Protocol } from "../../middleware/protocol";
import { Transcoder } from "../../utils/exports";

export type Plugin = (env: PluginEnvironment) => void | Promise<void>;

export type PluginDescriptor = {
    address: Address;
    plugin_ident: PluginIdentWithInstanceId;
}

export class PluginEnvironment extends EnvironmentCommunicator {
    static plugins: PluginEnvironment[] = [];
    readonly plugin_message_partners: PluginMessagePartner[] = [];
    readonly library_message_partners: LibraryMessagePartner[] = [];
    constructor(
        readonly kernel_process_id: string,
        readonly plugin_ident: PluginIdentWithInstanceId
    ) {
        super(plugin_ident.instance_id);
        PluginEnvironment.plugins.push(this);
    }

    get kernel_address() {
        return new Address(
            this.kernel_process_id,
            "kernel"
        )
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

    remove_self() {
        return this._send_kernel_message("remove_self");
    }
    _on_remove_cb: () => Promise<void> = () => Promise.resolve();
    on_remove(remove_cb: () => Promise<void> | void) {
        this._on_remove_cb = () => Promise.resolve(remove_cb());
    }
    async _trigger_remove_environment() {
        await this._on_remove_cb().catch(() => { });
        await Promise.all(
            this.plugin_message_partners.map(pm => pm.remove())
        );
    }

    _send_kernel_message(msg: Json) {
        this.#execute_kernel_protocol(send_kernel_message, msg);
    }

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

    static find(plugin_ident: string | PluginIdentWithInstanceId | Json): PluginEnvironment | null {
        let instance_id: string | undefined;
        if (typeof plugin_ident === "string") {
            instance_id = plugin_ident;
        } else {
            try {
                instance_id = Schema.decodeUnknownSync(pluginIdentWithInstanceIdSchema)(plugin_ident).instance_id;
            } catch (error) {
                return null;
            }
        }
        return PluginEnvironment.plugins.find(plugin => plugin.plugin_ident.instance_id === instance_id) || null;
    }

    static get findTranscoder() {
        return Transcoder.SchemaTranscoder(Schema.Union(
            pluginIdentWithInstanceIdSchema, Schema.String
        ))
    }
}
