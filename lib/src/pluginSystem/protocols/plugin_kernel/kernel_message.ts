
import { PluginEnvironment } from "../../plugin_side/plugin_environment";
import { KernelEnvironment } from "../../kernel_side/kernel_env";
import { PluginIdentWithInstanceId } from "../../plugin_side/plugin_ident";
import MessageChannel from "../../../middleware/channel";
import { Json } from "../../../messaging/core/message";
import { protocol } from "../../../middleware/protocol";

export const send_kernel_message = protocol(
    "send_kernel_message",
    KernelEnvironment.find,
    async (mc: MessageChannel, initiator: PluginEnvironment) => { },
    async (mc: MessageChannel, responder: KernelEnvironment, message: {
        data: Json,
        plugin: PluginIdentWithInstanceId
    }) => {
        responder.receive_plugin_message(message.data, message.plugin);
    }
);
