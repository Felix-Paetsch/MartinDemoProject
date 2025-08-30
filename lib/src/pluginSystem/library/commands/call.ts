import { Effect, Schema } from "effect";
import { ProtocolErrorN } from "../../../messaging/protocols/base/protocol_errors";
import { EnvironmentT } from "../../../pluginSystem/common_lib/messageEnvironments/environment";
import { LibraryMessagePartner } from "../../../pluginSystem/plugin_lib/message_partners/library";
import { callbackAsEffect } from "../../../utils/boundary/callbacks";
import { runEffectAsPromise } from "../../../utils/boundary/run";
import { Json } from "../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../common_lib/env_communication/EnvironmentCommunicationHandler";
import { LibraryEnvironment } from "../library_environment";

const callSchema = Schema.Struct({
    fn: Schema.String,
    args: Schema.Array(Schema.Any)
});

export function call_impl(this: LibraryMessagePartner, fn: string, args: Json[]) {
    return runEffectAsPromise(
        Effect.gen(this, function* () {
            const handlerE = yield* this._send_env_command(
                "call",
                Schema.encodeSync(callSchema)({
                    fn,
                    args: args
                }) as any,
                5000
            ).pipe(
                Effect.provideService(EnvironmentT, this.plugin_env.env)
            );

            const handler = yield* handlerE;
            return handler.protocol_data;
        }).pipe(
            Effect.catchAll(e => ProtocolErrorN({
                message: e.message || "Failed to call function",
                error: e instanceof Error ? e : new Error(String(e))
            }))
        )
    );
}

export function register_call_command(LEC: typeof LibraryEnvironment) {
    LEC.add_plugin_command({
        command: "call",
        on_command: Effect.fn("call")(
            function* (
                lib: LibraryEnvironment,
                handler: EnvironmentCommunicationHandler,
                data: Json
            ) {
                const { fn, args } = yield* Schema.decodeUnknown(callSchema)(data).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Failed to decode call data",
                        error: e
                    }))
                );

                const res: Json = yield* callbackAsEffect(lib.implementation.call)(fn, args, handler.message).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: e.message || "Failed to call function",
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