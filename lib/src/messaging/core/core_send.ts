import { Address } from "./address";
import { applyMiddleware } from "./middleware";
import { Message, TransmittableMessage } from "./message";
import { isMiddlewareInterrupt } from "./middleware";
import { HandledError } from "./errors/errors";
import { global_middleware } from "./middleware";
import { Connection } from "./connection";

export class AddressNotFoundError extends Error {
    constructor(readonly address: Address) {
        // @ts-ignore
        super(`Address: '${address.toString()}' not found`, {
            cause: address
        });
    }
}


export async function core_send(msg: TransmittableMessage) {
    if (typeof msg === "string") {
        msg = Message.deserialize(msg);
    }

    Object.assign(msg.local_data, {
        at_target: false,
        at_source: false,
        current_address: Address.local_address,
        direction: "at_kernel"
    });

    const interrupt = await applyMiddleware(msg, global_middleware);

    if (isMiddlewareInterrupt(interrupt)) {
        return;
    }

    let outConnection = Connection.open_connections.find(c => c.address.equals(msg.target));
    if (!outConnection) {
        const generic_target = msg.target.as_generic();
        outConnection = Connection.open_connections.find(c => {
            return c.address.as_generic().equals(generic_target);
        });
    }
    if (!outConnection) {
        outConnection = Connection.open_connections.find(c => {
            return c.address.as_generic().equals(Address.generic())
        });
    }
    if (!outConnection) {
        return HandledError.handleAnomary(new AddressNotFoundError(msg.target));
    }

    outConnection.__send_message(msg);
}
