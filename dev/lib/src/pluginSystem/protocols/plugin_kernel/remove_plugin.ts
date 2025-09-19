import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { protocol, Protocol, send_await_response_transcoded, receive_transcoded, send_transcoded } from "../../../middleware/protocol";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import MessageChannel from "../../../middleware/channel";
import { type PluginReference } from "../../kernel_lib/external_references/plugin_reference";
import { deferred } from "../../../utils/defer";

export type GetPluginError = Error;
export const remove_plugin_protocol = protocol(
    "remove_plugin",
    deferred(() => PluginEnvironment.findTranscoder),
    deferred(() => PluginEnvironment.find),
    async (mc: MessageChannel, initiator: PluginReference) => {
        return await mc.next()
    },
    async (mc: MessageChannel, responder: PluginEnvironment) => {
        await responder._trigger_remove_environment();
        mc.send("ok");
    }
);

