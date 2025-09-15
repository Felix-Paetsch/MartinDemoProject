import { PluginEnvironment } from "../../plugin_lib/plugin_environment";
import { Protocol, registerProtocol } from "../../../middleware/protocol";
import { KernelEnvironment } from "../../kernel_lib/kernel_env";
import { PluginIdent, pluginIdentSchema, pluginIdentWithInstanceIdSchema } from "../../plugin_lib/plugin_ident";
import { findKernel, findPlugin } from "../findResponder";
import MessageChannel from "../../../middleware/channel";
import { Effect, Schema } from "effect";
import { AddressFromString } from "../../../messagingEffect/schemas";
import { failOnError } from "../../../messagingEffect/utils";
import PluginMessagePartner from "../../plugin_lib/message_partner/plugin_message_partner";
import { v4 as uuidv4 } from "uuid";

const pluginData = Schema.Struct({
    address: AddressFromString,
    plugin_ident: pluginIdentWithInstanceIdSchema
})

export type GetPluginError = Error;
export const get_plugin_from_kernel: Protocol<
    PluginEnvironment,
    KernelEnvironment,
    typeof pluginData.Type | GetPluginError,
    PluginIdent,
    null
> = {
    name: "get_plugin_from_kernel",
    initiate: async (mc: MessageChannel, initiator: PluginEnvironment, plugin_ident: PluginIdent) => {
        return Effect.gen(function* () {
            yield* Effect.promise(() => mc.send(plugin_ident)).pipe(failOnError);
            const pd = yield* Effect.promise(() => mc.next()).pipe(failOnError);
            return yield* Schema.decodeUnknown(pluginData)(pd);
        }).pipe(
            Effect.merge,
            Effect.runPromise
        )
    },
    respond: async (mc: MessageChannel, responder: KernelEnvironment) => {
        await Effect.gen(function* () {
            const data = yield* Effect.promise(() => mc.next()).pipe(failOnError);
            const plugin_ident = yield* Schema.decodeUnknown(pluginIdentSchema)(data);
            const plugin = yield* Effect.promise(() => responder.get_plugin(plugin_ident)).pipe(failOnError);
            const plugin_data = yield* Schema.encode(pluginData)({
                address: plugin.address,
                plugin_ident: plugin.plugin_ident
            });
            yield* Effect.promise(() => mc.send(plugin_data)).pipe(failOnError);
        }).pipe(
            Effect.merge,
            Effect.runPromise
        )
    },
    findResponder: findKernel
}

registerProtocol(get_plugin_from_kernel);

const getPluginMessageData = Schema.Struct({
    mp_uuid: Schema.String,
    plugin_ident: pluginIdentWithInstanceIdSchema,
    address: AddressFromString
})

export const make_plugin_message_partner: Protocol<
    PluginEnvironment,
    PluginEnvironment,
    PluginMessagePartner | GetPluginError,
    typeof pluginData.Type,
    typeof pluginData.Encoded
> = {
    name: "create_plugin_message_partner",
    initiate: async (mc: MessageChannel, initiator: PluginEnvironment, plugin_ident: typeof pluginData.Type) => {
        return Effect.gen(function* () {
            const mp_uuid = uuidv4();
            yield* Effect.promise(() => mc.send(
                Schema.encodeSync(getPluginMessageData)({
                    mp_uuid,
                    plugin_ident: initiator.plugin_ident,
                    address: initiator.address
                })
            ));

            yield* Effect.promise(() => mc.next()).pipe(failOnError);

            return new PluginMessagePartner(
                plugin_ident,
                mp_uuid,
                initiator
            );
        }).pipe(
            Effect.runPromise
        );
    },
    respond: async (mc: MessageChannel, responder: PluginEnvironment) => {
        return Effect.gen(function* () {
            const data = yield* Effect.promise(() => mc.next()).pipe(failOnError);
            const r = yield* Schema.decodeUnknown(getPluginMessageData)(data);
            const mp = new PluginMessagePartner(
                {
                    address: r.address,
                    plugin_ident: r.plugin_ident
                },
                r.mp_uuid,
                responder
            );
            yield* Effect.tryPromise({
                try: () => responder._trigger_on_plugin_request(mp),
                catch: (e) => e as Error
            });
        }).pipe(
            Effect.ignore,
            Effect.andThen(() => Effect.promise(() => mc.send("OK"))),
            Effect.runPromise
        );
    },
    findResponder: findPlugin
}

registerProtocol(make_plugin_message_partner);