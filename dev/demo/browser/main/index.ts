import { Effect } from "effect";
import { LogInvestigator } from "../../../lib/src/debug/exports";
import { LocalAddress } from "../../../lib/src/messaging/exports";
import { createLocalEnvironment } from "../../../lib/src/pluginSystem/common_lib/exports";
import { EffectToResult, ResultToEffect } from "../../../lib/src/utils/boundary/run";
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
    EffectToResult
)