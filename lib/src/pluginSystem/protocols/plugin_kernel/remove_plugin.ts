import { PluginEnvironment } from "../../plugin_side/plugin_environment";
import MessageChannel from "../../../middleware/channel";
import { type PluginReference } from "../../kernel_side/external_references/plugin_reference";
import { deferred } from "../../../utils/defer";
import { protocol } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_side/kernel_env";

export type GetPluginError = Error;
export const remove_plugin_protocol = protocol(
    "remove_plugin",
    deferred(() => PluginEnvironment.findTranscoder),
    deferred(() => PluginEnvironment.find),
    async (mc: MessageChannel, initiator: PluginReference) => {
        const next = await mc.next()
        return next;
    },
    async (mc: MessageChannel, responder: PluginEnvironment) => {
        await responder._trigger_remove_environment();
        mc.send("ok");
    }
);

