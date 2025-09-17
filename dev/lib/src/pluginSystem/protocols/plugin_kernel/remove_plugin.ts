
import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { protocol, Protocol, AnythingTranscoder, send_await_response_transcoded, SchemaTranscoder, receive_transcoded, send_transcoded } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import { findKernel, findPlugin } from "../findResponder";
import MessageChannel from "../../../middleware/channel";
import { Effect, Schema } from "effect";
import { AddressFromString } from "../../../messagingEffect/schemas";
import { failOnError } from "../../../messagingEffect/utils";
import PluginMessagePartner from "../../plugin_lib/message_partner/plugin_message_partner";
import { v4 as uuidv4 } from "uuid";
import { PluginReference } from "../../../_pluginSystem/kernel_lib/exports";

export type GetPluginError = Error;
export const remove_plugin_protocol = protocol(
    "remove_plugin",
    SchemaTranscoder(pluginIdentWithInstanceIdSchema),
    findPlugin,
    async (mc: MessageChannel, initiator: PluginReference) => {
        return await mc.next()
    },
    async (mc: MessageChannel, responder: PluginEnvironment) => {
        await responder._trigger_remove_environment();
        mc.send("ok");
    }
);

