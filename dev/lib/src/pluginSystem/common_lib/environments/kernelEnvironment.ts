import { Effect } from "effect";
import { Address } from "../../../messaging/core/address";
import { Middleware, useMiddleware } from "../../../messaging/core/middleware";
import { send } from "../../../messaging/core/lib/send";
import { Environment } from "./environment";

export const KernelEnv = {
    get address() {
        return Address.local_address;
    },
    send: send,
    remove: Effect.void,
    useMiddleware: (middleware: Middleware) => useMiddleware({
        middleware: middleware,
        address: Address.local_address
    }).pipe(Effect.orDie),
    // is_active: () => true
} satisfies Environment;