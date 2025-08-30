import { Effect, Schema } from "effect";
import { callbackAsEffect } from "../../../../utils/boundary/callbacks";
import { Json } from "../../../../utils/json";
import { EnvironmentCommunicationHandler } from "../../../common_lib/env_communication/EnvironmentCommunicationHandler";

import { KernelEnvironment } from "../kernel_env";

export function register_kernel_message_command(KEV: typeof KernelEnvironment) {
    KEV.add_plugin_command({
        command: "send_kernel_message",
        on_command: Effect.fn("recieve_kernel_message")(
            function* (communicator: KernelEnvironment, handler: EnvironmentCommunicationHandler, _data: Json) {
                const { command, data } = yield* Schema.decodeUnknown(Schema.Struct({
                    command: Schema.String,
                    data: Schema.Any
                }))(_data).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Failed to decode kernel message",
                        error: e
                    }))
                );

                const ref = communicator.get_plugin_reference(handler.communication_target);
                if (!ref) {
                    return;
                }

                yield* callbackAsEffect(
                    communicator.on_kernel_message.bind(communicator)
                )(command, data, ref.plugin_ident).pipe(
                    Effect.catchAll(e => handler.errorR({
                        message: "Failed to handle message kernel side",
                        error: e
                    }))
                );
            })
    })
}