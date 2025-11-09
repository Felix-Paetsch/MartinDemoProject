
import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import MessageChannel from "../../../middleware/channel";
import { Schema } from "effect";
import { Json } from "../../../messaging/core/message";
import { protocol } from "../../../middleware/protocol";
import { Transcoder } from "../../../utils/exports";

const kernelMessageSchema = Schema.Struct({
    data: Schema.Any,
    plugin: pluginIdentWithInstanceIdSchema
})

export const send_kernel_message = protocol(
    "send_kernel_message",
    KernelEnvironment.findTranscoder,
    KernelEnvironment.find,
    async (mc: MessageChannel, initiator: PluginEnvironment, data: Json) => {
        await mc.send_encoded(
            Transcoder.SchemaTranscoder(kernelMessageSchema),
            {
                data,
                plugin: initiator.plugin_ident
            }
        );
    },
    async (mc: MessageChannel, responder: KernelEnvironment) => {
        const message = await mc.next_decoded(
            Transcoder.SchemaTranscoder(kernelMessageSchema)
        );
        if (message instanceof Error) return;
        responder.receive_plugin_message(message.data, message.plugin);
    }
);
