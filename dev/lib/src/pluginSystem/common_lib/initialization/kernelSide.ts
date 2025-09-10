import { Deferred, Effect } from "effect";
import { Address } from "../../../messaging/core/address";
import { CommunicationChannel, registerCommunicationChannel } from "../../../messaging/core/lib/communication_channel";
import { TransmittableMessage, TransmittableMessageT } from "../../../messaging/core/message";
import { Json } from "../../../utils/json";
import { PluginIdentWithInstanceId } from "../../plugin_lib/plugin_env/plugin_ident";

export type MessageChannel = {
    send: (data: Json) => void;
    recieve: (cb: (data: Json) => void) => void;
}

type KernelInitializationContext = {
    on_message: Effect.Effect<void, never, TransmittableMessageT>;
    on_remove: Effect.Effect<void, never, never>;
    kernelAddress: Address;
    pluginAddress: Address;
    sendOverPort: (message: Json) => void;
    plugin_initialized: () => void;
    plugin_evaluated: () => void;
    pluginIdent: PluginIdentWithInstanceId;
};

export function kernel_initializePlugin(
    port: MessageChannel,
    kernel_address: Address,
    address: Address,
    pluginIdent: PluginIdentWithInstanceId
) {
    return Effect.gen(function* () {
        const awaitLoaded = yield* Deferred.make<0>();
        const awaitEvaluated = yield* Deferred.make<0>();
        const context: KernelInitializationContext = {
            on_message: Effect.void,
            on_remove: Effect.void,
            kernelAddress: kernel_address,
            pluginAddress: address,
            sendOverPort: port.send,
            plugin_initialized: () => Deferred.succeed(awaitLoaded, 0).pipe(
                Effect.runSync
            ),
            plugin_evaluated: () => Deferred.succeed(awaitEvaluated, 0).pipe(
                Effect.runSync
            ),
            pluginIdent
        }

        const channel = yield* buildChannel(context);
        yield* registerCommunicationChannel(channel); // We don't know yet if other side registered the listener. But it will have by the time the plugin as run.

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

        MessageReactions["ck-request-init-env"]({}, context);
        yield* Deferred.await(awaitLoaded);
        return {
            "remove": () => context.on_remove.pipe(Effect.runPromise),
            "execute": () => Effect.gen(function* () {
                context.sendOverPort({
                    type: "ck-request-execute",
                    value: {}
                });
                yield* Deferred.await(awaitEvaluated);
            }).pipe(Effect.runPromise)
        }
    })
}

const MessageReactions = {
    "ck-message": (data: any, context: KernelInitializationContext) => {
        TransmittableMessage.from_unknown(data).pipe(
            Effect.andThen(message => context.on_message.pipe(
                Effect.provideService(TransmittableMessageT, message),
                Effect.runPromise
            )),
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore,
            Effect.runPromise
        );
    },
    "ck-request-init-env": (data: any, context: KernelInitializationContext) => {
        context.sendOverPort({
            type: "ck-response-init-env",
            value: {
                kernelAddress: context.kernelAddress.serialize(),
                pluginAddress: context.pluginAddress.serialize(),
                pluginIdent: context.pluginIdent
            }
        });
    },
    "ck-env-loaded": (data: any, context: KernelInitializationContext) => {
        context.plugin_initialized();
    },
    "ck-plugin-evaluated": (data: any, context: KernelInitializationContext) => {
        context.plugin_evaluated();
    }
} as const;

const buildChannel = (context: KernelInitializationContext) => Effect.sync(() => {
    const send: CommunicationChannel['send'] = Effect.fn("sendKernelSide")(
        function* (tm: TransmittableMessage) {
            context.sendOverPort({
                type: "ck-message",
                value: tm.string
            });
        }
    );


    const recieve_cb: CommunicationChannel['recieve_cb'] = (recieve_effect) => {
        context.on_message = recieve_effect;
    };

    const remove_cb: CommunicationChannel['remove_cb'] = (remove_effect) => {
        const old_remove = context.on_remove;
        context.on_remove = old_remove.pipe(Effect.andThen(remove_effect));
    };

    return {
        address: context.pluginAddress,
        send,
        recieve_cb,
        remove_cb
    } as CommunicationChannel;
});