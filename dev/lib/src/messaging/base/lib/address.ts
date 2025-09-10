import { Effect } from "effect";
import { Schema } from "effect";
import { Address } from "../address";
import { AddressDeserializationError } from "../errors/anomalies";

export const SerializedAddressSchema = Schema.Struct({
    process_id: Schema.String,
    port: Schema.String
})

export function deserializeAddressFromUnknown(serialized: unknown): Effect.Effect<Address, AddressDeserializationError> {
    return Effect.gen(function* () {
        const json = yield* Schema.decodeUnknown(SerializedAddressSchema)(serialized);
        return new Address(json.process_id, json.port);
    }).pipe(
        Effect.mapError(() => new AddressDeserializationError({ address: serialized }))
    )
}