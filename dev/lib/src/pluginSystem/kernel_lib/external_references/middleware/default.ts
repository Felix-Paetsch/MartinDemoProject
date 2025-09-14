import { Middleware } from "../../../../messaging/exports";

export function defaultMiddleware() {
    return Middleware.partition_middleware([
        "preprocessing",
        "monitoring",
        "listeners",
    ] as const);
}