import { Effect, flow } from "effect";
import { ProtocolErrorN } from "../../../messaging/protocols/base/protocol_errors";
import { EnvironmentT } from "../../../pluginSystem/common_lib/messageEnvironments/environment";
import { LibraryMessagePartner } from "../../../pluginSystem/plugin_lib/message_partners/library";
import { asyncCallbackToEffect } from "../../../utils/boundary/callbacks";
import { EffectToResult } from "../../../utils/boundary/run";
import { Json } from "../../../utils/json";
import { promisify } from "../../../utils/promisify";
import { EnvironmentCommunicationHandler } from "../../common_lib/env_communication/EnvironmentCommunicationHandler";
import { LibraryEnvironment } from "../library_environment";

export function get_exposed_functions_impl(this: LibraryMessagePartner) {
    return EffectToResult(
        Effect.gen(this, function* () {
            const handlerE = yield* this._send_env_command(
                "get_exposed",
                null,
                5000
            ).pipe(
                Effect.provideService(EnvironmentT, this.env)
            );

            const handler = yield* handlerE;
            return handler.protocol_data;
        }).pipe(
            Effect.catchAll(e => ProtocolErrorN({
                message: "Failed to get exposes",
                error: e instanceof Error ? e : new Error(String(e))
            }))
        )
    );
}

export function register_exposes_command(LEC: typeof LibraryEnvironment) {
    LEC.add_plugin_command({
        command: "get_exposed",
        on_command: Effect.fn("get_exposed")(
            function* (
                lib: LibraryEnvironment,
                handler: EnvironmentCommunicationHandler,
                _: Json
            ) {
                const res: Json = yield* asyncCallbackToEffect(
                    flow(lib.implementation.exposes, promisify), handler.message
                ).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Failed to get exposes",
                        error: e
                    }))
                );
                yield* handler.close(res, true).pipe(
                    Effect.catchAll(e => ProtocolErrorN({
                        message: "Failed to close handler",
                        error: new Error(String(e))
                    }))
                );
            })
    })
}