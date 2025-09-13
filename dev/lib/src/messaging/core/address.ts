import { Effect, Equal, Hash, Schema } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { deserializeAddressFromUnknown } from "../../messagingEffect/schemas";
import { SerializedAddressSchema } from "../../messagingEffect/schemas";
import { AddressDeserializationError } from "./errors/anomalies";

export namespace Address {
    export type ProcessID = string;
    export type PortID = string;

    export type SerializedAddress = {
        process_id: ProcessID;
        port: PortID;
    };
}

export class Address implements Equal.Equal {
    private _process_id: Address.ProcessID;
    private _port: Address.PortID;
    static process_id: Address.ProcessID = uuidv4();

    constructor(
        process_id: Address.ProcessID = uuidv4(),
        port: Address.PortID = uuidv4()
    ) {
        this._process_id = process_id;
        this._port = port;
    }

    get process_id(): string {
        return this._process_id;
    }

    get port(): string {
        return this._port;
    }

    as_generic(): Address {
        return new Address(this.process_id, "*");
    }

    forward_port(port: Address.PortID): Address {
        return new Address(this.process_id, port);
    }

    static generic(process_id: Address.ProcessID): Address {
        return new Address(process_id, "*");
    }

    [Equal.symbol](that: Equal.Equal): boolean {
        if (that instanceof Address) {
            return (
                Equal.equals(this.process_id, that.process_id) &&
                Equal.equals(this.port, that.port)
            )
        }

        return false
    }

    equals(that: Address): boolean {
        return Equal.equals(this, that);
    }

    [Hash.symbol](): number {
        return Hash.hash(this.port)
    }

    serialize(): Address.SerializedAddress {
        return Schema.encodeSync(SerializedAddressSchema)(this);
    }

    static deserialize(serialized: Address.SerializedAddress): Address {
        // Errors: AddressDeserializationError
        return deserializeAddressFromUnknown(serialized).pipe(
            Effect.runSync
        );
    }

    static deserialize_unknown(serialized: unknown): Address | AddressDeserializationError {
        return deserializeAddressFromUnknown(serialized).pipe(
            Effect.merge,
            Effect.runSync
        );
    }

    static set_process_id(process_id: Address.ProcessID) {
        Address.process_id = process_id;
    }

    static get local_address() {
        return new LocalAddress("*");
    }

    static new_local_address = (port: string = uuidv4()) => {
        return new LocalAddress(port);
    }
}

export class LocalAddress extends Address {
    constructor(
        port: string = uuidv4()
    ) {
        super(Address.process_id, port)
    }

    get process_id() {
        return Address.process_id
    }

    as_generic(): Address {
        return new LocalAddress("*");
    }

    forward_port(port: Address.PortID): Address {
        return new LocalAddress(port);
    }

    static get local_address() {
        return new LocalAddress("*");
    }
}