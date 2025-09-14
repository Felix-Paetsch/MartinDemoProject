import { executeProtocol, Protocol, ProtocolError } from "../../../middleware/protocol";
import { Address, Json, Middleware, Port } from "../../../messaging/exports";
import { defaultEnvironmentMiddleware } from "./default_middleware";

export abstract class EnvironmentCommunicator {
    readonly port: Port;
    private partitionMiddleware: ReturnType<typeof defaultEnvironmentMiddleware>;

    constructor(
        port: string
    ) {
        this.port = new Port(port);
        this.port.open();

        this.partitionMiddleware = defaultEnvironmentMiddleware();
        this.port.use_middleware(this.partitionMiddleware());
    }

    get address(): Address {
        return this.port.address;
    }

    use_middleware(
        mw: Middleware.Middleware,
        position: Middleware.PartitionMiddlewareKeys<typeof this.partitionMiddleware>
    ) {
        this.partitionMiddleware[position].push(mw);
        return;
    }

    execute_protocol<Responder extends NonNullable<unknown>, Result, InitData>(
        protocol: Protocol<this, Responder, Result, InitData>,
        target: Address,
        initData: InitData,
        responderIdentifier: Json
    ): Promise<Result | ProtocolError> {
        return executeProtocol(
            protocol,
            this,
            target,
            this.port,
            responderIdentifier,
            initData
        );
    }
}