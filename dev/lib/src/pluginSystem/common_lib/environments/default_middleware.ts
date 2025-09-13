import { Middleware } from "../../../messaging/exports";

// TODO: Add by default middleware for channel processing
export const defaultEnvironmentMiddleware = () => Middleware.partition_middleware([
    "preprocessing",
    "monitoring",
    "listeners",
] as const);