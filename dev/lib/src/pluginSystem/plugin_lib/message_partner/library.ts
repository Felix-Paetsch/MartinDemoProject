import { MessagePartner } from "./base";
import { Address } from "../../../messaging/exports";
import { LibraryEnvironment, LibraryIdent } from "../../library/library_environment";
import { PluginEnvironment } from "../plugin_environment";
import { Json } from "../../../utils/json";
import { Protocol } from "../../../middleware/protocol";
import { call_protocol } from "../../protocols/plugin_library/call";

export type LibraryDescriptor = {
    address: Address;
    library_ident: LibraryIdent;
}

export default class LibraryMessagePartner extends MessagePartner {
    constructor(
        readonly library_descriptor: LibraryDescriptor,
        readonly env: PluginEnvironment,
        readonly uuid: string
    ) {
        super(uuid, null as any);
        (this as any).root_message_partner = this;
        env.library_message_partners.push(this);
    }

    call(fn: string, ...args: Json[]) {
        return this.#execute_library_protocol(call_protocol, { fn, args });
    }

    #execute_library_protocol<Result, InitData>(
        protocol: Protocol<
            LibraryMessagePartner,
            LibraryEnvironment,
            InitData,
            LibraryIdent,
            Result
        >,
        initData: InitData
    ): Promise<Result | Error> {
        return protocol(
            this,
            this.env.port,
            this.library_descriptor.address,
            initData,
            this.library_descriptor.library_ident
        );
    }
}
