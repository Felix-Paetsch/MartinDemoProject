import { Address, Middleware } from "../../../messaging/exports";
import { defaultMiddleware } from "./middleware/default";
import { Connection } from "../../../messaging/exports";

export class ExternalReference {
    public is_removed = false;
    protected partitionMiddleware!: ReturnType<typeof defaultMiddleware>;

    constructor(
        readonly connection: Connection,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve(),
    ) {
        this.partitionMiddleware = defaultMiddleware();
        this.connection.use_middleware(this.partitionMiddleware());
    }

    get address(): Address {
        return this.connection.address;
    }

    use_middleware(
        mw: Middleware.Middleware,
        position: Middleware.PartitionMiddlewareKeys<typeof this.partitionMiddleware>
    ) {
        this.partitionMiddleware[position].push(mw);
    }

    async remove() {
        if (this.is_removed) return Promise.resolve();
        this.connection.close();
        return await this.on_remove();
    }
}