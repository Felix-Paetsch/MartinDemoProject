import LibraryMessagePartner from "./library";
import PluginMessagePartner from "./plugin_message_partner";

export class MessagePartner {
    static message_partners: MessagePartner[] = [];
    constructor(
        readonly uuid: string,
        readonly root_message_partner: PluginMessagePartner | LibraryMessagePartner
    ) {
        MessagePartner.message_partners.push(this);
    }
}