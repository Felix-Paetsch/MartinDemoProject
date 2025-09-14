import { v4 as uuidv4 } from "uuid";
import { Address } from "../../../../messaging/core/address";
import { Environment } from "../../../common_lib/messageEnvironments/environment";
import { PluginIdentWithInstanceId } from "../../plugin_env/plugin_ident";
import { MessagePartner } from "../message_partner/message_partner";

export class PluginMessagePartner extends MessagePartner {
    constructor(
        address: Address,
        env: Environment,
        readonly plugin_ident: PluginIdentWithInstanceId,
        uuid: string = uuidv4()
    ) {
        super(address, env, uuid);
    }
}