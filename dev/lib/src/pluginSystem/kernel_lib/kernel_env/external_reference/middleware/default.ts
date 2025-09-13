import { partition_middleware } from "../../../../../messaging/middlewares/partition";

export function defaultMiddleware() {
    return partition_middleware([
        "preprocessing",
        "monitoring",
        "listeners",
    ] as const);
}