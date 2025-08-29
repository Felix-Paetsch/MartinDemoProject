import { Effect, Schema } from "effect";
import { v4 as uuidv4 } from "uuid";
import { Address } from "../../../../messaging/base/address";
import { ProtocolErrorN } from "../../../../messaging/protocols/base/protocol_errors";
import { EnvironmentT } from "../../../../pluginSystem/common_lib/messageEnvironments/environment";
import { callbackAsEffect, CallbackError } from "../../../../utils/boundary/callbacks";
import { runEffectAsPromise } from "../../../../utils/boundary/run";
import { Json } from "../../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../../common_lib/env_communication/EnvironmentCommunicationHandler";
import { PluginMessagePartner } from "../../message_partners/plugin";
import { PluginEnvironment } from "../plugin_env";
import { PluginIdent, pluginIdentSchemaWithInstanceId } from "../plugin_ident";

export default function (PEC: typeof PluginEnvironment) {
    PEC.prototype.get_plugin = function (plugin_ident: PluginIdent) {
        return runEffectAsPromise(
            Effect.gen(this, function* () {
                const handlerE = yield* this._send_command(
                    this.kernel_address,
                    "get_plugin",
                    plugin_ident,
                    5000
                ).pipe(
                    Effect.provideService(EnvironmentT, this.env)
                );

                const handler = yield* handlerE;

                const responseData = handler.protocol_data;
                const plugin_data = yield* Schema.decodeUnknown(
                    Schema.Struct({
                        address: Address.AddressFromString,
                        plugin_ident: pluginIdentSchemaWithInstanceId
                    })
                )(responseData);

                const mp_uuid = uuidv4();
                const pluginHandlerE = yield* this._send_command(
                    plugin_data.address,
                    "get_plugin",
                    {
                        mp_uuid,
                        plugin_ident: this.plugin_ident
                    },
                    5000
                ).pipe(
                    Effect.provideService(EnvironmentT, this.env)
                );

                yield* pluginHandlerE;
                const messagePartner = new PluginMessagePartner(
                    plugin_data.address,
                    this.env,
                    plugin_data.plugin_ident,
                    mp_uuid
                );
                return messagePartner;
            }).pipe(
                Effect.catchAll(e => ProtocolErrorN({
                    message: "Failed to get plugin",
                    error: e instanceof Error ? e : new Error(String(e))
                }))
            )
        );
    }

    PEC.prototype._on_plugin_request = function (mp: PluginMessagePartner, data?: Json): Effect.Effect<void, CallbackError> {
        return Effect.void;
    }
    PEC.prototype.on_plugin_request = function (cb: (mp: PluginMessagePartner, data?: Json) => void) {
        this._on_plugin_request = callbackAsEffect(cb);
    }

    PEC.add_plugin_command({
        command: "get_plugin",
        on_command: Effect.fn("get_plugin")(
            function* (
                communicator: PluginEnvironment,
                handler: EnvironmentCommunicationHandler,
                data: Json
            ) {
                const {
                    mp_uuid,
                    plugin_ident
                } = yield* Schema.decodeUnknown(
                    Schema.Struct({
                        mp_uuid: Schema.String,
                        plugin_ident: pluginIdentSchemaWithInstanceId
                    })
                )(data).pipe(
                    Effect.catchAll(e => ProtocolErrorN({
                        message: "Failed to get plugin",
                        error: e instanceof Error ? e : new Error(String(e))
                    }))
                );

                const message_partner = new PluginMessagePartner(
                    handler.communication_target,
                    communicator.env,
                    plugin_ident,
                    mp_uuid
                );
                yield* communicator._on_plugin_request(message_partner, data).pipe(
                    Effect.catchAll(e => ProtocolErrorN({
                        message: "Error in plugin request callback",
                        error: e instanceof Error ? e : new Error(String(e))
                    }))
                );
                yield* handler.close({ success: true, partner_created: true }, true).pipe(
                    Effect.catchAll(e => ProtocolErrorN({
                        message: "Failed to close handler",
                        error: new Error(String(e))
                    }))
                );
            })
    })
}