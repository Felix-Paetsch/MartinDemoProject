import { Deferred, Duration, Effect } from "effect";
import { Connection } from "../../../../messaging/exports";
import { Json } from "../../../../utils/json";
import { PrimitiveMessageChannel, Synchronizer } from "./synchronizer";
import { Failure, Address } from "../../../../messaging/exports";
import { PluginIdentWithInstanceId } from "../../../../pluginSystem/exports";

export type PluginInitializationError = Error;

export async function initializeExternalPlugin_KernelSide(
    channel: PrimitiveMessageChannel,
    pluginIdent: PluginIdentWithInstanceId
): Promise<{
    connection: Connection,
    run_plugin: () => Promise<void>
} | PluginInitializationError> {
    return Effect.gen(function* () {
        const synchronizer = new Synchronizer(channel);
        const connection = Connection.create(
            Address.generic(pluginIdent.instance_id),
            (msg) => {
                return synchronizer.call_command("send_message", msg)
            }
        );

        synchronizer.add_command("send_message", (data: Json) => {
            return connection.receive(data as any);
        });

        yield* Effect.promise(() => synchronizer.sync()).pipe(
            Effect.timeout(Duration.millis(2000))
        );

        const awaitEvaluated = yield* Deferred.make<0>();
        synchronizer.add_command("on_plugin_executed", () => {
            Deferred.succeed(awaitEvaluated, 0).pipe(Effect.runSync)
        });

        const r = connection.open();
        if (r instanceof Failure.AddressAlreadyInUseError) {
            return yield* Effect.fail(r);
        }

        return {
            connection,
            run_plugin: () => Effect.gen(function* () {
                synchronizer.call_command("run_plugin", {
                    pluginIdent,
                    plugin_process_id: pluginIdent.instance_id,
                    kernel_process_id: Address.process_id
                });
                yield* Deferred.await(awaitEvaluated);
            }).pipe(
                Effect.timeout(5000),
                Effect.ignore,
                Effect.runPromise
            )
        }
    }).pipe(
        Effect.merge,
        Effect.runPromise
    )
}
