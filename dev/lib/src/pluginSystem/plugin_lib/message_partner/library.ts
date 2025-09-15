import { MessagePartner } from "./base";
import { Address } from "../../../messaging/exports";
import { LibraryEnvironment, LibraryIdent } from "../../library/library_environment";
import { PluginEnvironment } from "../plugin_environment";
import { Json } from "../../../utils/json";
import { executeProtocol, Protocol } from "../../../middleware/protocol";
import { call_protocol } from "../../protocols/plugin_library/call";

export type LibraryDescriptor = {
    address: Address;
    library_ident: LibraryIdent;
}

export default class LibraryMessagePartner extends MessagePartner {
    constructor(
        readonly library_descriptor: LibraryDescriptor,
        readonly env: PluginEnvironment,
    ) {
        super();
        env.library_message_partners.push(this);
    }

    call(fn: string, ...args: Json[]) {
        return this.#execute_library_protocol(call_protocol, { fn, args });
    }

    #execute_library_protocol<Result, InitData>(
        protocol: Protocol<
            LibraryMessagePartner,
            LibraryEnvironment,
            Result,
            InitData,
            LibraryIdent
        >,
        initData: InitData
    ): Promise<Result | Error> {
        return executeProtocol(
            protocol,
            this,
            this.library_descriptor.address,
            this.env.port,
            this.library_descriptor.library_ident,
            initData
        );
    }
}
