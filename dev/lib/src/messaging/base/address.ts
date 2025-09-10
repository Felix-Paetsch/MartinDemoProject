import { Context, Data, Effect, Equal, Hash, Schema } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { AddressDeserializationError } from "./errors/anomalies"

export class AddressT extends Context.Tag("AddressT")<AddressT, Address>() { }

export type ProcessID = string
export type Port = string

const SerializedAddressSchema = Schema.Struct({
    process_id: Schema.String,
    port: Schema.String
})

export type SerializedAddress = {
    process_id: ProcessID,
    port: Port
}

export class Address implements Equal.Equal {
    readonly _process_id: ProcessID;
    readonly _port: Port;

    constructor(
        process_id: ProcessID = uuidv4(),
        port: Port = uuidv4()
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
        return Address.deserializeE(serialized).pipe(
            Effect.runSync
        );
    }

    static deserializeE(serialized: unknown): Effect.Effect<Address, AddressDeserializationError> {
        return Effect.gen(function* () {
            const json = yield* Schema.decodeUnknown(SerializedAddressSchema)(serialized);
            return new Address(json.process_id, json.port);
        }).pipe(
            Effect.mapError(() => new AddressDeserializationError({ address: serialized }))
        )
    }

    private static _local_address: Address = new Address(uuidv4(), uuidv4());
    static setLocalAddress(address: Address) {
        if (address instanceof LocalAddress) {
            this._local_address = new Address(address.process_id, address.port);
            return;
        }
        this._local_address = address;
    }

    static get local_address() {
        return this._local_address;
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
        return Address.local_address.process_id
    }
}
