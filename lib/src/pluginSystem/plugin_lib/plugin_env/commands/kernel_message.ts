import { Effect } from "effect";
import { EffectToResult } from "../../../../utils/boundary/run";
import { Json } from "../../../../utils/json";
import { PluginEnvironment } from "../plugin_env";

export function send_kernel_message_impl(this: PluginEnvironment, command: string, data: Json) {
    return EffectToResult(
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