import { Effect } from "effect";
import { Address } from "../../../messaging/base/address";
import { fail_as_protocol_error, ProtocolError, ProtocolErrorN } from "../../../messaging/protocols/base/protocol_errors";
import { Json } from "../../../utils/json";
import { MessageEnvironmentProtocol } from "../messageEnvironments/messageEnvironment_protocol";
import { EnvironmentCommunicationHandler } from "./EnvironmentCommunicationHandler";
import { EnvironmentCommunicator } from "./environment_communicator";

export interface EnvironmentCommand {
    command: string;
    data: Json;
    handler: EnvironmentCommunicationHandler;
}

export class EnvironmentCommunicationProtocol extends MessageEnvironmentProtocol<Effect.Effect<EnvironmentCommunicationHandler, ProtocolError>, EnvironmentCommand> {
    constructor(
        private communicator: EnvironmentCommunicator
    ) {
        super(communicator.env, "environment_communication", "main", "1.0.0");
    }

    run(): Effect.Effect<Effect.Effect<EnvironmentCommunicationHandler, ProtocolError>, ProtocolError> {
        return ProtocolErrorN({
            message: "Use run_command method instead for environment communication"
        });
    }

    /*(
        target_address: Address,
        command: string,
        data?: Json,
        timeout?: number
    ): Effect.Effect<
        Effect.Effect<EnvironmentCommunicationHandler, ProtocolError>,
        ProtocolError
    > */
    run_command = Effect.fn("run_command")(
        function* (
            this: EnvironmentCommunicationProtocol,
            target_address: Address,
            command: string,
            data?: Json,
            timeout?: number
        ) {
            const handlerE = yield* this.send_first_message(
                target_address,
                {
                    command,
                    data: data || null,
                    timeout: timeout || 0
                },
                timeout
            );

            return handlerE.pipe(
                Effect.andThen(handler => EnvironmentCommunicationHandler.fromEnvironmentMessage(handler.__current_pm))
            );
        }, e => e.pipe(fail_as_protocol_error)
    )

    on_first_request = Effect.fn(
        function* (this: EnvironmentCommunicationProtocol, pch) {
            const handler = yield* EnvironmentCommunicationHandler.fromEnvironmentMessage(pch.__current_pm);
            return yield* this.on_callback({
                command: handler.command,
                data: handler.protocol_data,
                handler
            })
        }
    )

    on_callback = (cmd: EnvironmentCommand): Effect.Effect<void, ProtocolError> => {
        return this.communicator._receive_command(cmd.command, cmd.data, cmd.handler);
    }
}
