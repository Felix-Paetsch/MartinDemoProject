export * from "./common_exports";

import { MessagePartner } from "./plugin_lib/message_partner/base";
import PluginMessagePartner from "./plugin_lib/message_partner/plugin_message_partner";
import BranchedMessagePartner from "./plugin_lib/message_partner/branched_message_partner";

export {
    PluginMessagePartner,
    MessagePartner,
    BranchedMessagePartner
}

import { PluginEnvironment } from "./plugin_lib/plugin_environment";
export {
    PluginEnvironment
}
export type Plugin = (env: PluginEnvironment) => void | Promise<void>;
