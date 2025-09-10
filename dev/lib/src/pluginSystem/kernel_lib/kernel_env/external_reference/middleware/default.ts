import { Effect } from "effect";
import { Address } from "../../../../../messaging/core/address";
import { useMiddleware } from "../../../../../messaging/core/middleware";
import { partition_middleware } from "../../../../../messaging/middlewares/partition";

export const registerPluginReferenceMiddleware = function (address: Address) {
    return Effect.gen(function* () {
        const pm = defaultMiddleware();
        yield* useMiddleware({
            middleware: pm(),
            address: address
        }).pipe(Effect.ignore);

        return pm;
    })
};

export function defaultMiddleware() {
    return partition_middleware([
        "preprocessing",
        "monitoring",
        "listeners",
    ] as const);
}