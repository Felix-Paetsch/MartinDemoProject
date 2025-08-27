import { Effect, Equal } from "effect";
import { ProtocolError } from "pc-messaging-kernel/messaging/protocols/base/protocol_errors";
import { Json } from "pc-messaging-kernel/utils/json";
import { v4 as uuidv4 } from 'uuid';
import { Address } from "../../../messaging/base/address";
import { Middleware } from "../../../messaging/base/middleware";
import { Failure, ResultPromise, Success } from "../../../utils/boundary/result";
import { ResultToEffect, runEffectAsPromise } from "../../../utils/boundary/run";
import { EnvironmentCommunicator } from "../../common_lib/env_communication/environment_communicator";
import { Environment } from "../../common_lib/messageEnvironments/environment";
import { KernelEnv } from "../../common_lib/messageEnvironments/kernelEnvironment";
import { createLocalEnvironment } from "../../common_lib/messageEnvironments/localEnvironment";
import { PluginEnvironment } from "../../plugin_lib/plugin_env/plugin_env";
import { PluginIdent, PluginIdentWithInstanceId } from "../../plugin_lib/plugin_env/plugin_ident";
import applyGetPluginPrototypeModifier from "./commands/get_plugin";
import applyKernelMessagePrototypeModifier from "./commands/kernel_message";
import applyRemovePluginPrototypeModifier from "./commands/remove_plugin";
import { PluginReference } from "./plugin_reference/plugin_reference";

export abstract class KernelEnvironment extends EnvironmentCommunicator {
    private registered_plugins: PluginReference[] = [];
    constructor(
        readonly env: Environment = KernelEnv
    ) {
        super(env);
        this.command_prefix = "KERNEL";
        this.register_kernel_middleware();
    }

    get address() {
        return this.env.ownAddress;
    }

    register_kernel_middleware(): void { }
    register_plugin_middleware(ref: PluginReference): void { }
    register_local_plugin_middleware(env: PluginEnvironment): void { }

    use_middleware(middleware: Middleware): Promise<Success<void>> {
        return this.env.useMiddleware(middleware).pipe(
            Effect.andThen(() => new Success(undefined)),
            Effect.runPromise
        );
    }

    start() {
        return this.get_plugin({
            name: "START"
        })
    }

    create_local_plugin_environment(address: Address, plugin_ident: PluginIdent): ResultPromise<{
        env: PluginEnvironment,
        ref: PluginReference
    }, Error> {
        return Effect.gen(this, function* () {
            const Lenv = yield* createLocalEnvironment(address);
            const uuid = uuidv4();
            const ident = {
                instance_id: uuid,
                ...plugin_ident
            }

            const plugin_env = new PluginEnvironment(Lenv, this.address, ident);
            const ref = new PluginReference(
                address,
                ident,
                this,
                plugin_env.remove_self.bind(plugin_env),
                (mw: Middleware) => Lenv.useSendMiddleware(mw).pipe(Effect.runSync)
            )

            return {
                env: plugin_env,
                ref: ref
            }
        }).pipe(
            Effect.withSpan("KernelCreateLocalPluginEnvironment"),
            runEffectAsPromise
        );
    }

    get_plugin(plugin_ident: PluginIdent): ResultPromise<PluginReference, Error> {
        const existingPlugin = this.registered_plugins.find(plugin => plugin.plugin_ident.instance_id === plugin_ident.instance_id);
        if (existingPlugin) {
            return Success.promise(existingPlugin);
        }
        if (plugin_ident.instance_id) {
            return Failure.promise(new Error("Plugin instance id not found"))
        }

        return this.create_plugin(
            plugin_ident
        ).then(res => {
            if (res.is_error) return res;
            this.registered_plugins.push(res.value);
            return res;
        });
    }

    get_plugin_reference(
        plugin_ident: PluginIdent | PluginReference | string | Address
    ): PluginReference | null {
        if (typeof plugin_ident === "string") {
            return this.registered_plugins.find(plugin => plugin.plugin_ident.instance_id === plugin_ident) || null;
        }
        if (plugin_ident instanceof PluginReference) {
            return this.get_plugin_reference(plugin_ident.plugin_ident);
        }
        if (plugin_ident instanceof PluginReference) {
            return plugin_ident;
        }
        if (plugin_ident instanceof Address) {
            for (const ref of this.registered_plugins) {
                if (Equal.equals(ref.address, plugin_ident)) {
                    return ref;
                }
            }
        }
        return null;
    }

    create_plugin(plugin_ident: PluginIdent): ResultPromise<PluginReference, Error> {
        return Failure.promise(new Error("Create plugin not implemented"))
    };

    remove_plugin(ref: PluginReference): ResultPromise<void, Error> {
        return Effect.gen(this, function* () {
            yield* ResultToEffect(ref.remove());
            const index = this.registered_plugins.findIndex(plugin => plugin.plugin_ident.instance_id === ref.plugin_ident.instance_id);
            if (index !== -1) {
                this.registered_plugins.splice(index, 1);
            }
        }).pipe(
            Effect.catchAll(e => Effect.succeed(console.log(e))),
            runEffectAsPromise
        );
    }

    on_kernel_message(command: string, data: any, plugin_ident: PluginIdentWithInstanceId) { }

    _send_remove_plugin_message(address: Address, data: Json): Effect.Effect<void, ProtocolError> { throw new Error("Method not implemented."); };
}

applyGetPluginPrototypeModifier(KernelEnvironment)
applyRemovePluginPrototypeModifier(KernelEnvironment)
applyKernelMessagePrototypeModifier(KernelEnvironment)