export * from "./common_exports";

import Bridge from "./plugin_lib/message_partner/bridge";
import { MessagePartner } from "./plugin_lib/message_partner/base";
import LibraryMessagePartner from "./plugin_lib/message_partner/library";
import PluginMessagePartner from "./plugin_lib/message_partner/plugin_message_partner";
export {
    LibraryMessagePartner,
    PluginMessagePartner,
    MessagePartner,
    Bridge
}

import { PluginEnvironment } from "./plugin_lib/plugin_environment";
export {
    PluginEnvironment
}
export type Plugin = (env: PluginEnvironment) => void | Promise<void>;
