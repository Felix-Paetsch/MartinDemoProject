import { Schema } from "effect";
import { v4 as uuidv4 } from "uuid";
import { Address } from "../../../../messaging/base/address";
import { Json } from "../../../../utils/json";
import { call_impl } from "../../../library/commands/call";
import { get_exposed_functions_impl } from "../../../library/commands/exposes";
import { MessagePartner } from "../message_partner/message_partner";
import { PluginEnvironment } from "../../plugin_env/plugin_env";

export const libraryIdentSchema = Schema.Struct({
    name: Schema.String,
    version: Schema.String
})

export type LibraryIdent = Schema.Schema.Type<typeof libraryIdentSchema>;

export class LibraryMessagePartner extends MessagePartner {
    constructor(
        address: Address,
        readonly plugin_env: PluginEnvironment,
        readonly library_ident: LibraryIdent,
        uuid: string = uuidv4()
    ) {
        super(address, plugin_env.env, uuid);
    }

    call(fn: string, ...args: Json[]) {
        return call_impl.call(this, fn, args);
    }

    exposed_functions() {
        return get_exposed_functions_impl.call(this);
    }

    _send_env_command(command: string, data: Json, timeout: number = 5000) {
        return this.plugin_env._send_command(this.address, command, data, timeout);
    }
}