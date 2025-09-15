import { PluginIdentWithInstanceId } from "../plugin_lib/plugin_ident";
import { KernelEnvironment } from "../kernel_lib/kernel_env";
import { PluginEnvironment } from "../plugin_lib/plugin_environment";
import { Json } from "../../utils/json";
import { Effect, Schema } from "effect";
import { pluginIdentWithInstanceIdSchema } from "../plugin_lib/plugin_ident";
import PluginMessagePartner, { PluginMessagePartnerID } from "../plugin_lib/message_partner/plugin_message_partner";
import Bridge from "../plugin_lib/message_partner/bridge";

export function findKernel(): KernelEnvironment | null {
    return KernelEnvironment.singleton;
}

export function findPlugin(plugin_ident: unknown | string | PluginIdentWithInstanceId | Json): PluginEnvironment | null {
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

const pluginMessagePartnerData = Schema.Struct({
    plugin_message_partner_uuid: Schema.String,
    plugin_instance_id: Schema.String
})

export function findPluginMessagePartner(plugin_ident: unknown | {
    plugin_message_partner_uuid: PluginMessagePartnerID,
    plugin_instance_id: string
}): PluginMessagePartner | null {
    const data = Schema.decodeUnknown(pluginMessagePartnerData)(plugin_ident).pipe(
        Effect.orElse(() => Effect.succeed(null)),
        Effect.runSync
    );
    if (!data) return null;
    const plugin = PluginEnvironment.plugins.find(
        plugin => plugin.plugin_ident.instance_id === data.plugin_instance_id
    );
    if (!plugin) return null;
    return plugin.plugin_message_partners.find(
        mp => mp.uuid === data.plugin_message_partner_uuid
    ) || null;
}

const bridgeData = Schema.Struct({
    plugin_message_partner_uuid: Schema.String,
    plugin_instance_id: Schema.String,
    bridge_uuid: Schema.String
})

export function findBridge(bridge_ident: unknown | {
    plugin_message_partner_uuid: PluginMessagePartnerID,
    plugin_instance_id: string,
    bridge_uuid: string
}): Bridge | null {
    const mp = findPluginMessagePartner(bridge_ident);
    if (!mp) return null;
    return mp.bridges.find(b => b.uuid === (bridge_ident as any).bridge_uuid) || null;
}