import { Effect } from "effect";
import { runEffectAsPromise } from "../../../../utils/boundary/run";
import { Json } from "../../../../utils/json";
import { PluginEnvironment } from "../plugin_env";

export default function (PEC: typeof PluginEnvironment) {
    PEC.prototype.send_kernel_message = function (command: string, data: Json) {
        return runEffectAsPromise(
            this._send_command(
                this.kernel_address,
                "send_kernel_message",
                {
                    command,
                    data
                },
                1000
            ).pipe(Effect.withSpan("send_kernel_message"))
        );
    }
}