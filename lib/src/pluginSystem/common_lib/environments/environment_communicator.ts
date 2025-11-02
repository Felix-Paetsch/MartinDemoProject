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

    execute_protocol<Responder extends NonNullable<unknown>, IdentData, InitData, Result>(
        protocol: Protocol<this, Responder, IdentData, InitData, Result>,
        target: Address,
        initData: InitData,
        responderIdentifier: IdentData
    ): Promise<Result | Error> {
        return protocol(
            this,
            this.port,
            target,
            responderIdentifier,
            initData
        );
    }
}
