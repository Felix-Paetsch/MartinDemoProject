import { Effect } from "effect";
import { Address } from "../../../../messaging/base/address";

import { ProtocolErrorN } from "../../../../messaging/protocols/base/protocol_errors";
import { Json } from "../../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../../common_lib/env_communication/EnvironmentCommunicationHandler";
import { EnvironmentT } from "../../../common_lib/messageEnvironments/environment";
import { KernelEnvironment } from "../kernel_env";

export function _send_remove_plugin_message(this: KernelEnvironment, address: Address, data?: Json) {
    return Effect.gen(this, function* () {
        yield* yield* this._send_command(
            address,
            "remove_plugin"
        )
    }).pipe(
        Effect.provideService(EnvironmentT, this.env)
    );
}

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