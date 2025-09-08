import { Effect } from "effect";
import { LogInvestigator } from "pc-messaging-kernel/debug";
import { LocalAddress } from "pc-messaging-kernel/messaging";
import { createLocalEnvironment } from "pc-messaging-kernel/pluginSystem/common";
import { ResultToEffect, runEffectAsPromise } from "pc-messaging-kernel/utils";
import "../local_plugins/main.css";
import { KernelImpl } from "./kernel/index";

declare global {
    var logInverstigator: LogInvestigator;
}

Effect.gen(function* () {
    const kernel_address = new LocalAddress("KERNEL");
    const kernel_env = yield* createLocalEnvironment(kernel_address);
    const kernel = new KernelImpl(kernel_env);
    yield* ResultToEffect(kernel.start());
}).pipe(
    Effect.catchAll(e => Effect.succeed(console.log(e))),
    runEffectAsPromise
)