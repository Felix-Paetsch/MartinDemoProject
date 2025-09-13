import { Effect } from "effect";
import { Address } from "../../../messaging/core/address";
import { Middleware } from "../../../messaging/core/middleware";
import { PartitionMiddlewareKeys } from "../../../messaging/middlewares/partition";
import { ProtocolError, ProtocolErrorN } from "../../../messaging/protocols/base/protocol_errors";
import { Json } from "../../../utils/json";
import { Environment } from "../messageEnvironments/environment";
import { defaultEnvironmentMiddleware } from "./default_middleware";
import { EnvironmentCommunicationHandler } from "./EnvironmentCommunicationHandler";
import { EnvironmentCommunicationProtocol } from "./protocol";
import { Port } from "../../../messaging/exports";
import { processMessageChannelMessage } from "pc-messaging-kernel/middleware/channel/middleware";
import MessageChannel from "../../../middleware/channel";

type CommandPrefix = "BOTH" | "KERNEL" | "PLUGIN";
type Command = `${CommandPrefix}::${string}`;

export abstract class EnvironmentCommunicator {
    protected port: Port;
    protected command_prefix: CommandPrefix;
    private static classCommands = new Map<Function, {
        [key: Command]: {
            command: Command;
            on_command: (communicator: any, handler: EnvironmentCommunicationHandler, data: Json) => Effect.Effect<void, ProtocolError, never>;
        }
    }>();

    private partitionMiddleware!: ReturnType<typeof defaultEnvironmentMiddleware>;
    private communication_protocol!: EnvironmentCommunicationProtocol;

    constructor(
        port: string
    ) {
        this.port = new Port(port);
        this.port.open();
        this.command_prefix = "BOTH";

        this.partitionMiddleware = defaultEnvironmentMiddleware();
        this.port.use_middleware(this.partitionMiddleware());
    }

    get address(): Address {
        return this.port.address;
    }

    use_middleware(
        mw: Middleware,
        position: PartitionMiddlewareKeys<typeof this.partitionMiddleware>
    ) {
        this.partitionMiddleware[position].push(mw);
        return;
    }

    _send_command(
        target_address: Address,
        command: string,
        data?: Json,
        timeout?: number
    ): Effect.Effect<
        Effect.Effect<EnvironmentCommunicationHandler, ProtocolError>,
        ProtocolError
    > {
        const new MessageChannel(
            target_address, this.port,
            { target_processor: "test" },
            { defaultMessageTimeout: 600000 }
        );
    }

    _receive_command = Effect.fn("receive_command")(
        function* (
            this: EnvironmentCommunicator,
            command: string,
            data: Json,
            handler: EnvironmentCommunicationHandler
        ) {
            const registeredCommand = (this.constructor as typeof EnvironmentCommunicator).get_command(command);
            if (registeredCommand) {
                return yield* registeredCommand.on_command(this, handler, data);
            }

            return yield* ProtocolErrorN({
                message: `Unknown command: ${command}`,
                data: { command, data }
            })
        }
    )

    private static _initializeClassCommands(classConstructor: Function): void {
        if (!EnvironmentCommunicator.classCommands.has(classConstructor)) {
            EnvironmentCommunicator.classCommands.set(classConstructor, {});
        }
    }

    private static add_command<T extends EnvironmentCommunicator = EnvironmentCommunicator>(command: {
        command: string;
        on_command: (communicator: T, handler: EnvironmentCommunicationHandler, data: Json) => Effect.Effect<void, ProtocolError>;
    }): void {
        EnvironmentCommunicator._initializeClassCommands(this);
        const classCommandMap = EnvironmentCommunicator.classCommands.get(this)!;
        if (!command.command.startsWith("PLUGIN::") && !command.command.startsWith("KERNEL::")) {
            command.command = "BOTH::" + command.command;
        }
        const cmd = command.command as any;
        classCommandMap[cmd] = command as any;
    }

    static add_kernel_command<T extends EnvironmentCommunicator = EnvironmentCommunicator>(command: {
        command: string;
        on_command: (communicator: T, handler: EnvironmentCommunicationHandler, data: Json) => Effect.Effect<void, ProtocolError>;
    }) {
        return this.add_command({
            command: "KERNEL::" + command.command,
            on_command: command.on_command
        });
    }

    static add_plugin_command<T extends EnvironmentCommunicator = EnvironmentCommunicator>(command: {
        command: string;
        on_command: (communicator: T, handler: EnvironmentCommunicationHandler, data: Json) => Effect.Effect<void, ProtocolError>;
    }) {
        return this.add_command({
            command: "PLUGIN::" + command.command,
            on_command: command.on_command
        });
    }

    static get_command(prefixCommand: string): {
        command: Command;
        on_command: (communicator: EnvironmentCommunicator, handler: EnvironmentCommunicationHandler, data: Json) => Effect.Effect<void, ProtocolError>;
    } | undefined {
        const cmd = prefixCommand as Command;
        let currentClass: Function = this;
        while (currentClass && currentClass !== Function.prototype) {
            const classCommandMap = EnvironmentCommunicator.classCommands.get(currentClass);
            if (classCommandMap) {
                if (classCommandMap[cmd]) {
                    return classCommandMap[cmd];
                }

                if (cmd.startsWith("PLUGIN::") || cmd.startsWith("KERNEL::")) {
                    const commandPart = cmd.split("::", 2)[1];
                    const bothCommand = `BOTH::${commandPart}`;
                    if (classCommandMap[bothCommand as any]) {
                        return classCommandMap[bothCommand as any];
                    }
                }
            }
            currentClass = Object.getPrototypeOf(currentClass);
        }
        return undefined;
    }

    static get commands() {
        EnvironmentCommunicator._initializeClassCommands(this);
        const classCommandMap = EnvironmentCommunicator.classCommands.get(this)!;
        return Object.values(classCommandMap);
    }
}