import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { protocol, Protocol, AnythingTranscoder, send_await_response_transcoded, SchemaTranscoder, receive_transcoded, send_transcoded } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import MessageChannel from "../../../middleware/channel";
import { Effect, Schema } from "effect";
import { AddressFromString } from "../../../messagingEffect/schemas";
import PluginMessagePartner from "../../plugin_lib/message_partner/plugin_message_partner";
import uuidv4 from "../../../utils/uuid";
import { deferred } from "../../../utils/defer";

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
        return await send_await_response_transcoded(
            mc,
            SchemaTranscoder(pluginIdentSchema),
            plugin_ident,
            SchemaTranscoder(pluginData)
        );
    },
    async (mc: MessageChannel, responder: KernelEnvironment) => {
        const plugin_ident = await receive_transcoded(mc, SchemaTranscoder(pluginIdentSchema));
        if (plugin_ident instanceof Error) return;
        const plugin = await responder.get_plugin(plugin_ident);
        if (plugin instanceof Error) return;
        await send_transcoded(mc, SchemaTranscoder(pluginData), {
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
        const res = await send_await_response_transcoded(
            mc,
            SchemaTranscoder(getPluginMessageData),
            {
                mp_uuid,
                plugin_ident: initiator.plugin_ident,
                address: initiator.address
            },
            AnythingTranscoder
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
        const data = await receive_transcoded(mc, SchemaTranscoder(getPluginMessageData));
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
