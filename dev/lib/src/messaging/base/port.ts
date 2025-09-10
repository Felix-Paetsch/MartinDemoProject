import { Address, LocalAddress, PortID } from "./address";
import { isMiddlewareContinue, Middleware, MiddlewareInterrupt } from "./middleware";
import { Message, TransmittableMessage } from "./message";
import { Effect, Schema } from "effect";
import { HandledError, IgnoreHandled, PortClosedError } from "./errors/errors";
import { applyMiddlewareEffect } from "./lib/apply_middleware_effect";
import { Connection, PortConnection } from "./connection";
import { MessageFromString } from "./lib/message";
import { callbackToEffect } from "./errors/main";
import { MessageDeserializationError } from "./errors/anomalies";
import { core_send } from "./lib/core_send";

export default class Port {
    private _portID: PortID;
    private _is_open: boolean;
    private _recieve!: (msg: Message) => void | Promise<void>;
    private middleware: Middleware[] = [];
    readonly connection: PortConnection;

    static readonly open_ports: Port[] = [];
    static readonly connection: Connection;

    constructor(
        portID: PortID,
        recieve: (msg: Message) => void | Promise<void> = () => { }
    ) {
        this._portID = portID;
        this._is_open = false;
        this.connection = new PortConnection(this);
        this.update_recieve(recieve);
    }

    get id(): PortID {
        return this._portID;
    }

    update_id(portID: PortID): void {
        const is_open = this.is_open();
        this.close();
        this._portID = portID;
        if (is_open) {
            this.open();
        }
    }

    get address(): Address {
        return new LocalAddress(this._portID);
    }

    update_recieve(recieve: (msg: Message) => void | Promise<void>): void {
        this._recieve = recieve;
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
        Port.open_ports.splice(Port.open_ports.indexOf(this), 1);
        this._is_open = false;
        this.connection.close();
    }

    open(): void {
        // Errors: AddressAlreadyInUseError
        if (this.is_open()) {
            return;
        }

        this.connection.open();
        this._is_open = true;
        Port.open_ports.push(this);
    }

    is_open(): boolean { return this._is_open; }
    is_closed(): boolean { return !this._is_open; }

    async send(msg: Message): Promise<void> {
        // Errors: PortClosedError 
        // User sends a message through this port
        if (this.is_closed()) {
            throw new PortClosedError(this);
        }

        Object.assign(msg.local_data, {
            at_target: false,
            at_source: true,
            current_address: this.address,
            direction: "outgoing"
        });

        const interrupt = await applyMiddlewareEffect(msg, this.middleware).pipe(
            Effect.catchAll(() => Effect.succeed(MiddlewareInterrupt)),
            Effect.runPromise
        );

        if (!isMiddlewareContinue(interrupt)) {
            await core_send(msg).pipe(Effect.runPromise);
        }
    }

    __recieve_message(msg: TransmittableMessage): Promise<void> {
        const e: Effect.Effect<void> = Effect.gen(this, function* (this: Port) {
            if (typeof msg === "string") {
                msg = yield* Schema.decode(MessageFromString)(msg).pipe(
                    Effect.mapError(e => new MessageDeserializationError({ serialized: msg as string }))
                );
            }

            Object.assign(msg.local_data, {
                at_target: true,
                at_source: false,
                current_address: this.address,
                direction: "incoming"
            });
            const res = yield* applyMiddlewareEffect(msg, this.middleware);
            if (isMiddlewareContinue(res)) {
                yield* callbackToEffect(this._recieve, msg);
            }
        }).pipe(
            Effect.catchAll(HandledError.handleA),
            IgnoreHandled
        );
        return e.pipe(
            Effect.runPromise
        )
    }
}
