import { PluginEnvironment } from "../../plugin_side/plugin_environment";
import { KernelEnvironment } from "../../kernel_side/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_side/plugin_ident";
import MessageChannel from "../../../middleware/channel";
import { Schema } from "effect";
import { MessagingEffect } from "../../../messaging/exports";
import PluginMessagePartner from "../../plugin_side/message_partner/plugin_message_partner";
import { uuidv4 } from "../../../utils/uuid";
import { deferred } from "../../../utils/defer";
import { protocol } from "../../../middleware/protocol";
import { Transcoder } from "../../../utils/exports";

const pluginData = Schema.Struct({
    address: MessagingEffect.Address.AddressFromString,
    plugin_ident: pluginIdentWithInstanceIdSchema,
})

export type GetPluginError = Error;
export const get_plugin_from_kernel = protocol(
    "get_plugin_from_kernel",
    KernelEnvironment.find,
    async (mc: MessageChannel, initiator: PluginEnvironment) => {
        return await mc.next_decoded(
            Transcoder.SchemaTranscoder(pluginData)
        );
    },
    async (
        mc: MessageChannel,
        responder: KernelEnvironment,
        plugin_ident: PluginIdent
    ) => {
        const plugin = await responder.get_plugin(plugin_ident);
        if (plugin instanceof Error) return;
        await mc.send_encoded(Transcoder.SchemaTranscoder(pluginData), {
            address: plugin.address,
            plugin_ident: plugin.plugin_ident
        });
    }
);

const getPluginMessageData = Schema.Struct({
    mp_uuid: Schema.String,
    plugin_ident: pluginIdentWithInstanceIdSchema,
    address: MessagingEffect.Address.AddressFromString
});

export const make_plugin_message_partner = protocol(
    "create_plugin_message_partner",
    deferred(() => PluginEnvironment.find),
    async (mc: MessageChannel, initiator: PluginEnvironment) => {
        const res = await mc.next_decoded(
            Transcoder.SchemaTranscoder(getPluginMessageData),
        );
        if (res instanceof Error) return res;
        return new PluginMessagePartner(
            {
                plugin_ident: res.plugin_ident,
                address: res.address
            },
            true,
            res.mp_uuid,
            initiator
        );
    },
    async (mc: MessageChannel, responder: PluginEnvironment, plugin_ident: typeof pluginData.Encoded) => {
        const mp = new PluginMessagePartner(
            {
                address: plugin_ident.address,
                plugin_ident: plugin_ident.plugin_ident
            },
            false,
            data.mp_uuid,
            responder
        );
        await responder._trigger_on_plugin_request(mp).catch(e => e);
        await mc.send("OK");
    }
);
