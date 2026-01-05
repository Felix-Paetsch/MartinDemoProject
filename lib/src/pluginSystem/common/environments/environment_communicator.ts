import { Protocol, } from "../../../middleware/protocol";
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

    execute_protocol<
        Responder extends NonNullable<unknown>,
        InitiatorInitData,
        ResponderInitData extends Json,
        IdentData extends Json,
        Result
    >(
        protocol: Protocol<
            this,
            Responder,
            InitiatorInitData,
            ResponderInitData,
            IdentData,
            Result
        >,
        target: Address,
        initiatorInitData: InitiatorInitData,
        responderInitData: ResponderInitData,
        responderIdentifier: IdentData
    ): Promise<Result | Error> {
        return protocol(
            this,
            this.port,
            target,
            initiatorInitData,
            responderInitData,
            responderIdentifier,
        );
    }
}
