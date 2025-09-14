import { PluginDescriptor, PluginEnvironment } from "../plugin_environment";
import { MessagePartner } from "./base";

export default class PluginMessagePartner extends MessagePartner {
    constructor(
        private readonly plugin_descriptor: PluginDescriptor,
        private readonly uuid: string,
        private readonly env: PluginEnvironment,
    ) {
        super();
    }
}
