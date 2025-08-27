import { Address } from "../../../messaging/base/address";
import { Protocol } from "../../../messaging/protocols/protocol";
import { Json } from "../../../utils/json";
import { Environment } from "./environment";

export abstract class MessageEnvironmentProtocol<S, T> extends Protocol<S, T> {
    constructor(
        private env: Environment,
        protocol_name: string,
        protocol_ident: Json,
        protocol_version: string
    ) {
        super(protocol_name, protocol_ident, protocol_version);
    }

    send_first_message(
        target_address: Address,
        data: Json,
        timeout?: number
    ) {
        return super.send_first_message(
            target_address,
            data,
            timeout,
            this.env.send,
            this.env.ownAddress
        );
    }

    middleware() {
        return super.middleware(this.env.send);
    }
}
