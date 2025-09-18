import { MessagePartner, MessagePartnerPairDistinguisher } from "./base";
import { Address } from "../../../messaging/exports";
import { LibraryEnvironment, LibraryIdent } from "../../library/library_environment";
import { PluginEnvironment } from "../plugin_environment";
import { Json } from "../../../utils/json";
import { Protocol } from "../../../middleware/protocol";
import { call_protocol } from "../../protocols/plugin_library/call";
import { get_exposed_protocol } from "../../protocols/plugin_library/exposed";

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

        const own_part_distinguisher: MessagePartnerPairDistinguisher = true;
        (this as any).pair_distinguisher = own_part_distinguisher;
        (this as any).root_message_partner = this;

        env.library_message_partners.push(this);
    }

    get address() {
        return this.library_descriptor.address;
    }

    call(fn: string, ...args: Json[]) {
        return this.#execute_library_protocol(call_protocol, { fn, args });
    }

    exposed_functions() {
        return this.#execute_library_protocol(get_exposed_protocol, null);
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
