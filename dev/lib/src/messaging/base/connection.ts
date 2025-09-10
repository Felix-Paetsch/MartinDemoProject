import { Effect, Equal, flow } from "effect";
import { Address } from "./address";
import { SerializedMessage, TransmittableMessage } from "./message";
import { isMiddlewareContinue, Middleware } from "./middleware";
import Port from "./port";
import { AddressAlreadyInUseError, HandledError, IgnoreHandled } from "./errors/errors";
import { MessageDeserializationError, MessageSerializationError } from "./errors/anomalies";
import { Schema } from "effect";
import { MessageFromString } from "./lib/message";
import { applyMiddlewareEffect } from "./lib/apply_middleware_effect";
import { core_send } from "./lib/core_send";
import { callbackToEffect } from "./errors/main";

export function createConnection(
    address: Address,
    send: (msg: SerializedMessage) => void | Promise<void>
): Connection {
    return new Connection(
        address,
        flow(TransmittableMessageToSerializedMessage, send)
    );
}

function TransmittableMessageToSerializedMessage(msg: TransmittableMessage): SerializedMessage {
    if (typeof msg === "string") {
        return msg;
    }
    try {
        return msg.serialize();
    } catch (e) {
        HandledError.handleA(e as MessageSerializationError).pipe(
            Effect.runPromise
        );
        throw e;
    }
}

export class Connection {
    private _is_open: boolean;
    private middleware: Middleware[] = [];

    static readonly open_connections: Connection[] = [];

    constructor(
        private _address: Address,
        private _send: (msg: TransmittableMessage) => void | Promise<void>
    ) {
        this._is_open = false;
    }

    get address(): Address {
        return this._address;
    }

    update_address(address: Address): void {
        this._address = address;
    }

    update_send(send: (msg: SerializedMessage) => void | Promise<void>): void {
        this.update_sendTM(
            (msg) => Promise.resolve(
                send(TransmittableMessageToSerializedMessage(msg))
            )
        );
    }

    update_sendTM(send: (msg: TransmittableMessage) => Promise<void>): void {
        this._send = send;
    }

    recieve(msg: TransmittableMessage): Promise<void> {
        const e: Effect.Effect<void> = Effect.gen(this, function* (this: Connection) {
            if (typeof msg === "string") {
                msg = yield* Schema.decode(MessageFromString)(msg).pipe(
                    Effect.mapError(e => new MessageDeserializationError({ serialized: msg as string }))
                );
            }

            Object.assign(msg.local_data, {
                at_target: false,
                at_source: false,
                current_address: this.address,
                direction: "incomming"
            });

            const res = yield* applyMiddlewareEffect(msg, this.middleware);
            if (isMiddlewareContinue(res)) {
                yield* core_send(msg);
            }
        }).pipe(
            Effect.catchAll(HandledError.handleA),
            IgnoreHandled
        );
        return e.pipe(
            Effect.runPromise
        )
    }

    register_middleware(middleware: Middleware): void {
        this.middleware.push(middleware);
    }

    clear_middleware(): void {
        this.middleware.length = 0;
    }

    close(): void {
        if (this.is_closed()) {
            return;
        }
        this._is_open = false;
        Connection.open_connections.splice(Connection.open_connections.indexOf(this), 1);
    }

    open(): void {
        // Errors: AddressAlreadyInUseError
        if (this.is_open()) {
            return;
        }

        if (Connection.open_connections.some(c => {
            return Equal.equals(c.address, this.address)
                || Equal.equals(this.address, Address.local_address)
        })) {
            throw new AddressAlreadyInUseError(this.address);
        }

        this._is_open = true;
        Connection.open_connections.push(this);
    }

    is_open(): boolean { return this._is_open; }
    is_closed(): boolean { return !this._is_open; }

    __send_message(msg: TransmittableMessage): Effect.Effect<void, never, never> {
        return Effect.gen(this, function* (this: Connection) {
            if (typeof msg === "string") {
                msg = yield* Schema.decode(MessageFromString)(msg).pipe(
                    Effect.mapError(e => new MessageDeserializationError({ serialized: msg as string }))
                );
            }

            Object.assign(msg.local_data, {
                at_target: false,
                at_source: false,
                current_address: this.address,
                direction: "outgoing"
            });
            const res = yield* applyMiddlewareEffect(msg, this.middleware);
            if (isMiddlewareContinue(res)) {
                yield* callbackToEffect(this._send, msg);
            }
        }).pipe(
            Effect.catchAll(HandledError.handleA),
            IgnoreHandled
        );
    }
}

export class PortConnection extends Connection {
    constructor(
        private port: Port
    ) {
        super(
            port.address,
            (m: TransmittableMessage) => port.__recieve_message(m)
        );
    }

    open(): void {
        if (this.is_open()) {
            return;
        }
        super.open();
        this.port.open();
    }

    close(): void {
        if (this.is_closed()) {
            return;
        }
        super.close();
        this.port.close();
    }
}