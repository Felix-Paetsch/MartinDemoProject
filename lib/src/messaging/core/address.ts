import { Effect, Schema } from "effect";
import { uuidv4, type UUID } from "../../utils/uuid";
import { deserializeAddressFromUnknown, SerializedAddressSchema } from "../effect/address";

export class AddressNotFoundError extends Error {
    constructor(readonly address: Address) {
        // @ts-ignore
        super(`Address: '${address.toString()}' not found`, {
            cause: address
        });
    }
}

export class AddressDeserializationError extends Error {
    constructor(readonly wanna_be_address: any) {
        // @ts-ignore
        super("Address not deserializable", { cause: wanna_be_address });
    }
}

export class Address {
    private _process_id: Address.ProcessID;
    private _port: Address.PortID;
    static process_id: Address.ProcessID = uuidv4();

    constructor(
        process_id: Address.ProcessID = Address.process_id,
        port: Address.PortID = uuidv4()
    ) {
        this._process_id = process_id;
        this._port = port;
    }

    get process_id(): Address.ProcessID {
        return this._process_id;
    }

    get port(): Address.PortID {
        return this._port;
    }

    toString(): Address.StringSerializedAddress {
        return `${this.process_id}::${this.port}`
    }

    as_generic(): Address {
        return new Address(this.process_id, "*");
    }

    forward_port(port: Address.PortID): Address {
        return new Address(this.process_id, port);
    }

    static generic(process_id: Address.ProcessID = "*"): Address {
        return new Address(process_id, "*");
    }

    equals(that: Address): boolean {
        return this.toString() == that.toString()
    }

    serialize(): Address.SerializedAddress {
        return Schema.encodeSync(SerializedAddressSchema)(this);
    }

    static fromString(s: Address.StringSerializedAddress): Address {
        const parts = s.split("::");
        return new Address(parts[0], parts[1]);
    }

    static from_unknownString(s: unknown): Address | AddressDeserializationError {
        if (typeof s !== "string") return new AddressDeserializationError(s);
        const parts = s.split("::");
        if (parts.length !== 2 || parts[0]?.length == 0 || parts[1]?.length === 0) {
            return new AddressDeserializationError(s);
        }
        return new Address(parts[0], parts[1]);
    }

    static deserialize(serialized: Address.SerializedAddress): Address {
        return new Address(serialized.process_id, serialized.port);
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

    static new_local_address = (port: Address.PortID = uuidv4()) => {
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

    static set_process_id(process_id: Address.ProcessID): void {
        Address.set_process_id(process_id);
    }
}

export namespace Address {
    export type ProcessID = UUID;
    export type PortID = UUID;

    export type SerializedAddress = {
        process_id: ProcessID;
        port: PortID;
    };

    export type StringSerializedAddress = `${string}::${string}`
}
