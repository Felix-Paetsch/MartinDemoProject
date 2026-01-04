import { Address, LocalAddress } from "./address";
import { applyMiddleware, isMiddlewareContinue, Middleware } from "./middleware";
import { Message, TransmittableMessage } from "./message";
import { AddressAlreadyInUseError, PortConnection } from "./connection";
import { reportAnomaly } from "./errors/anomalies";
import { core_send } from "./core_send";

export class PortClosedError extends Error {
    constructor(port: Port) {
        // @ts-ignore
        super(`The port ${port.address.toString()} is closed`, { cause: port })
    }
}

export default class Port {
    private _portID: Address.PortID;
    private _is_open: boolean;
    private _receive!: (msg: Message) => void | Promise<void>;
    private middleware: Middleware[] = [];
    readonly connection: PortConnection;

    static readonly open_ports: Port[] = [];

    constructor(
        portID: Address.PortID,
        receive: (msg: Message) => void | Promise<void> = () => { }
    ) {
        this._portID = portID;
        this._is_open = false;
        this.connection = new PortConnection(this);
        this.update_receive(receive);
    }

    get id(): Address.PortID {
        return this._portID;
    }

    update_id(portID: Address.PortID): void {
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

    update_receive(receive: (msg: Message) => void | Promise<void>): void {
        this._receive = receive;
    }

    use_middleware(middleware: Middleware): void {
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

    open(): this | AddressAlreadyInUseError {
        if (this.is_open()) {
            return this;
        }

        const res = this.connection.open();
        if (res instanceof AddressAlreadyInUseError) return res;
        this._is_open = true;
        Port.open_ports.push(this);
        return this;
    }

    is_open(): boolean { return this._is_open; }
    is_closed(): boolean { return !this._is_open; }

    async send(msg: Message): Promise<void> {
        if (this.is_closed()) {
            reportAnomaly(new PortClosedError(this));
            return;
        }

        Object.assign(msg.local_data, {
            at_target: false,
            at_source: true,
            current_address: this.address,
            direction: "outgoing"
        });

        const interrupt = await applyMiddleware(msg, this.middleware);
        if (isMiddlewareContinue(interrupt)) {
            await core_send(msg);
        }
    }

    async __receive_message(msg: TransmittableMessage): Promise<void> {
        if (typeof msg === "string") {
            msg = Message.deserialize(msg)
        }

        Object.assign(msg.local_data, {
            at_target: true,
            at_source: false,
            current_address: this.address,
            direction: "incoming"
        });

        const res = await applyMiddleware(msg, this.middleware);

        if (isMiddlewareContinue(res)) {
            await this._receive(msg);
        }
    }
}
