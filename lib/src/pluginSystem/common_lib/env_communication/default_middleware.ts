import { Effect } from "effect";
import { partition_middleware } from "../../../messaging/middleware/partition";
import { Environment } from "../messageEnvironments/environment";

export const registerDefaultEnvironmentMiddleware = Effect.fn("registerDefaultEnvironmentMiddleware")(
    function* (env: Environment) {
        const pm = partition_middleware([
            "preprocessing",
            "monitoring",
            "listeners",
        ] as const);

        yield* env.useMiddleware(pm())
        return pm;
    }
);