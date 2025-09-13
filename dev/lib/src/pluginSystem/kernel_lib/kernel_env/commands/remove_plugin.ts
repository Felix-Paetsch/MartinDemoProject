import { Effect } from "effect";
import { ProtocolErrorN } from "../../../../messaging/protocols/base/protocol_errors";
import { EnvironmentCommunicationHandler } from "../../../common_lib/environments/EnvironmentCommunicationHandler";
import { KernelEnvironment } from "../kernel_env";

export function register_remove_plugin_command(KEV: typeof KernelEnvironment) {
    KEV.add_plugin_command({
        command: "remove_plugin_self",
        on_command: (env: KernelEnvironment, handler: EnvironmentCommunicationHandler) => {
            return Effect.gen(function* () {
                const ref = env.get_plugin_reference(handler.communication_target);

                if (!ref) return yield* ProtocolErrorN({ message: "Plugin Not Found" });
                env.remove_plugin(ref);
            }).pipe(Effect.ignore);
        }
    });
}