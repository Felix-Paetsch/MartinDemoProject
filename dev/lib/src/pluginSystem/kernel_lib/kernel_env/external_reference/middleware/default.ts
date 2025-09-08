import { Effect } from "effect";
import { Address } from "../../../../../messaging/base/address";
import { useMiddleware } from "../../../../../messaging/base/middleware";
import { partition_middleware } from "../../../../../messaging/middleware/partition";

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