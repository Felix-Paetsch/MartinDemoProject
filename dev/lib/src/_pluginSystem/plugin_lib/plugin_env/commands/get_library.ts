import { Effect, Schema } from "effect";
import { Address } from "../../../../messaging/core/address";
import { ProtocolErrorN } from "../../../../messaging/protocols/base/protocol_errors";
import { EffectToResult } from "../../../../utils/boundary/run";
import { EnvironmentT } from "../../../common_lib/messageEnvironments/environment";
import { LibraryIdent, libraryIdentSchema } from "../../../library/library_environment";
import { LibraryMessagePartner } from "../../message_partners/library";
import { PluginEnvironment } from "../plugin_env";

export function get_library(this: PluginEnvironment, library_ident: LibraryIdent) {
    return EffectToResult(
        Effect.gen(this, function* () {
            const handlerE = yield* this._send_command(
                this.kernel_address,
                "get_library",
                library_ident,
                5000
            ).pipe(
                Effect.provideService(EnvironmentT, this.env)
            );

            const handler = yield* handlerE;

            const responseData = handler.protocol_data;
            const library_data = yield* Schema.decodeUnknown(
                Schema.Struct({
                    address: Address.AddressFromString,
                    library_ident: libraryIdentSchema
                })
            )(responseData);

            return new LibraryMessagePartner(
                library_data.address,
                this,
                library_data.library_ident
            );
        }).pipe(
            Effect.catchAll(e => ProtocolErrorN({
                message: "Failed to get library",
                error: e instanceof Error ? e : new Error(String(e))
            }))
        )
    );
}