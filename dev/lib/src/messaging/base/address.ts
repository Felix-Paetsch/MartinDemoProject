import { Context, Effect, Equal, Hash, Schema } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { deserializeAddressFromUnknown, SerializedAddressSchema } from "./lib/address";

export class AddressT extends Context.Tag("AddressT")<AddressT, Address>() { }

export type ProcessID = string
export type PortID = string

export type SerializedAddress = {
    process_id: ProcessID,
    port: PortID
}

export class Address implements Equal.Equal {
    private _process_id: ProcessID;
    private _port: PortID;
    static process_id: ProcessID = uuidv4();

    constructor(
        process_id: ProcessID = uuidv4(),
        port: PortID = uuidv4()
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

    static generic(process_id: ProcessID): Address {
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

    [Hash.symbol](): number {
        return Hash.hash(this.port)
    }

    serialize(): SerializedAddress {
        return Schema.encodeSync(SerializedAddressSchema)(this);
    }

    static deserialize(serialized: SerializedAddress): Address {
        // Errors: AddressDeserializationError
        return deserializeAddressFromUnknown(serialized).pipe(
            Effect.runSync
        );
    }

    static set_process_id(process_id: ProcessID) {
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
        super(Address.local_address.process_id, port)
    }

    get process_id() {
        return Address.process_id
    }
}
