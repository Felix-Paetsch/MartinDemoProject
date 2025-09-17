
import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { protocol, Protocol, AnythingTranscoder, send_await_response_transcoded, SchemaTranscoder, receive_transcoded, send_transcoded } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import { findKernel, findPlugin } from "../findResponder";
import MessageChannel from "../../../middleware/channel";
import { Effect, Schema } from "effect";
import { Json } from "../../../messaging/core/message";

const kernelMessageSchema = Schema.Struct({
    data: Schema.Any,
    plugin: pluginIdentWithInstanceIdSchema
})

export const send_kernel_message = protocol(
    "send_kernel_message",
    AnythingTranscoder,
    findKernel,
    async (mc: MessageChannel, initiator: PluginEnvironment, data: Json) => {
        await send_transcoded(
            mc,
            SchemaTranscoder(kernelMessageSchema),
            {
                data,
                plugin: initiator.plugin_ident
            }
        );
    },
    async (mc: MessageChannel, responder: KernelEnvironment) => {
        const message = await receive_transcoded(
            mc, SchemaTranscoder(kernelMessageSchema)
        );
        if (message instanceof Error) return;
        responder.recieve_plugin_message(message.data, message.plugin);
    }
);
