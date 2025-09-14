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
    PluginIdent
> = {
    name: "get_plugin_from_kernel",
    initiate: async (mc: MessageChannel, initiator: PluginEnvironment, plugin_ident: PluginIdent) => {
        return Effect.promise(() => mc.send(plugin_ident)).pipe(
            Effect.as(Effect.promise(() => mc.next())),
            failOnError,
            Schema.decodeUnknown(pluginData),
            Effect.merge,
            Effect.runPromise
        )
    },
    respond: async (mc: MessageChannel, responder: KernelEnvironment) => {
        Effect.promise(() => mc.next()).pipe(
            failOnError,
            Schema.decodeUnknown(pluginIdentSchema),
            Effect.andThen(r => Effect.promise(() => responder.get_plugin(r))),
            failOnError,
            Effect.andThen(r => Schema.encode(pluginData)({
                address: r.address,
                plugin_ident: r.plugin_ident
            })),
            Effect.andThen(r => mc.send(r)),
            Effect.ignore,
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
    typeof pluginData.Type
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
        return Effect.promise(() => mc.next()).pipe(
            failOnError,
            Schema.decodeUnknown(getPluginMessageData),
            Effect.map(r => new PluginMessagePartner(
                {
                    address: r.address,
                    plugin_ident: r.plugin_ident
                },
                r.mp_uuid,
                responder
            )),
            Effect.andThen(r => Effect.tryPromise({
                try: () => responder._trigger_on_plugin_request(r),
                catch: (e) => e as Error
            })),
            Effect.ignore,
            Effect.andThen(() => Effect.promise(() => mc.send("OK"))),
            Effect.runPromise
        );
    },
    findResponder: findPlugin
}

registerProtocol(make_plugin_message_partner);