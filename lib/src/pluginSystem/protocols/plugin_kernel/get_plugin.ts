import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import MessageChannel from "../../../middleware/channel";
import { Schema } from "effect";
import { AddressFromString } from "../../../messagingEffect/schemas";
import PluginMessagePartner from "../../plugin_lib/message_partner/plugin_message_partner";
import { uuidv4 } from "../../../utils/uuid";
import { deferred } from "../../../utils/defer";
import { protocol } from "../../../middleware/protocol";
import { Transcoder } from "../../../utils/exports";

const pluginData = Schema.Struct({
    address: AddressFromString,
    plugin_ident: pluginIdentWithInstanceIdSchema
})

export type GetPluginError = Error;
export const get_plugin_from_kernel = protocol(
    "get_plugin_from_kernel",
    KernelEnvironment.findTranscoder,
    KernelEnvironment.find,
    async (mc: MessageChannel, initiator: PluginEnvironment, plugin_ident: PluginIdent) => {
        return await mc.send_await_next_transcoded(
            Transcoder.SchemaTranscoder(pluginIdentSchema),
            plugin_ident,
            Transcoder.SchemaTranscoder(pluginData)
        );
    },
    async (mc: MessageChannel, responder: KernelEnvironment) => {
        const plugin_ident = await mc.next_decoded(Transcoder.SchemaTranscoder(pluginIdentSchema));
        if (plugin_ident instanceof Error) return;
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
    address: AddressFromString
});

export const make_plugin_message_partner = protocol(
    "create_plugin_message_partner",
    deferred(() => PluginEnvironment.findTranscoder),
    deferred(() => PluginEnvironment.find),
    async (mc: MessageChannel, initiator: PluginEnvironment, plugin_ident: typeof pluginData.Type) => {
        const mp_uuid = uuidv4();
        const res = await mc.send_await_next_transcoded(
            Transcoder.SchemaTranscoder(getPluginMessageData),
            {
                mp_uuid,
                plugin_ident: initiator.plugin_ident,
                address: initiator.address
            },
            Transcoder.AnythingTranscoder
        );
        if (res instanceof Error) return res;
        return new PluginMessagePartner(
            plugin_ident,
            true,
            mp_uuid,
            initiator
        );
    },
    async (mc: MessageChannel, responder: PluginEnvironment) => {
        const data = await mc.next_decoded(Transcoder.SchemaTranscoder(getPluginMessageData));
        if (data instanceof Error) return;
        const mp = new PluginMessagePartner(
            {
                address: data.address,
                plugin_ident: data.plugin_ident
            },
            false,
            data.mp_uuid,
            responder
        );
        await responder._trigger_on_plugin_request(mp).catch(e => e);
        await mc.send("OK");
    }
);
