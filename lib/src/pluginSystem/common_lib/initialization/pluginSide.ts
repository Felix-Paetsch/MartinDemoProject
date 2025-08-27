import { Effect } from "effect";
import { Address } from "../../../messaging/base/address";
import { CommunicationChannel, registerCommunicationChannel } from "../../../messaging/base/communication_channel";
import { TransmittableMessage, TransmittableMessageT } from "../../../messaging/base/message";
import { callbackAsEffect } from "../../../utils/boundary/callbacks";
import { Json } from "../../../utils/json";
import { PluginEnvironment } from "../../plugin_lib/plugin_env/plugin_env";
import { PluginIdentWithInstanceId } from "../../plugin_lib/plugin_env/plugin_ident";
import { KernelEnv } from "../messageEnvironments/kernelEnvironment";
import type { MessageChannel } from "./kernelSide";

type PluginInitializationContext = {
    on_message: Effect.Effect<void, never, TransmittableMessageT>;
    kernelAddress: Address;
    pluginAddress: Address;
    sendOverPort: (message: Json) => void;
    on_env_initialized: (plugin_env: PluginEnvironment) => Effect.Effect<void, Error, never>;
    plugin: (env: PluginEnvironment) => Promise<void>;
    initialize_request_recieved: boolean;
    env: PluginEnvironment;
    pluginIdent: PluginIdentWithInstanceId;
};

export function plugin_initializePlugin(
    port: MessageChannel,
    on_env_initialized: (plugin_env: PluginEnvironment) => Effect.Effect<void, Error, never>,
    plugin: (env: PluginEnvironment) => Promise<void>
) {
    const context: Partial<PluginInitializationContext> = {
        sendOverPort: port.send,
        on_env_initialized,
        plugin,
        initialize_request_recieved: false
    }

    port.recieve(data => {
        return Effect.gen(function* () {
            const type = (data as any)?.type
            if (typeof type == "string" && type in MessageReactions && Object.keys(data!).includes("value")) {
                return MessageReactions[type as keyof typeof MessageReactions](
                    (data as any).value as Json, context
                );
            }
        }).pipe(
            Effect.runPromise
        )
    });

    context.sendOverPort?.({
        type: "ck-request-init-env",
        value: {}
    });
};

const MessageReactions = {
    "ck-message": (data: any, context: Partial<PluginInitializationContext>) => {
        TransmittableMessage.from_unknown(data).pipe(
            Effect.andThen(message => context.on_message!.pipe(
                Effect.provideService(TransmittableMessageT, message),
                Effect.runPromise
            )),
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore,
            Effect.runPromise
        );
    },
    "ck-response-init-env": (data: any, context: Partial<PluginInitializationContext>) => {
        if (context.initialize_request_recieved) return;
        context.initialize_request_recieved = true;

        Effect.gen(function* () {
            context.kernelAddress = yield* Address.deserialize(data.kernelAddress);
            context.pluginAddress = yield* Address.deserialize(data.pluginAddress);
            context.pluginIdent = data.pluginIdent;

            Address.setLocalAddress(context.pluginAddress);
            const channel = yield* buildChannel(context);
            yield* registerCommunicationChannel(channel);

            const env = new PluginEnvironment(
                KernelEnv,
                context.kernelAddress,
                context.pluginIdent!
            );
            context.env = env;
            yield* context.on_env_initialized!(env);

            context.sendOverPort?.({
                type: "ck-env-loaded",
                value: {}
            });
        }).pipe(Effect.runPromise)
    },
    "ck-request-execute": (data: any, context: Partial<PluginInitializationContext>) => {
        Effect.gen(function* () {
            yield* callbackAsEffect(context.plugin!)(context.env!);

            context.sendOverPort?.({
                type: "ck-plugin-evaluated",
                value: {}
            });
        }).pipe(Effect.runPromise)
    },
} as const;

const buildChannel = (context: Partial<PluginInitializationContext>) => Effect.sync(() => {
    const send: CommunicationChannel['send'] = Effect.fn("sendPluginSide")(
        function* (tm: TransmittableMessage) {
            context.sendOverPort!({
                type: "ck-message",
                value: tm.string
            });
        }
    );

    const recieve_cb: CommunicationChannel['recieve_cb'] = (recieve_effect) => {
        context.on_message = recieve_effect;
    };

    return {
        address: context.kernelAddress!.as_generic(),
        send,
        recieve_cb
    } as CommunicationChannel;
});
