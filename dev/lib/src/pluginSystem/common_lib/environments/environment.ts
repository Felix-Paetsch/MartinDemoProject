import { Context, Effect } from "effect";
import { Address } from "../../../messaging/core/address";
import { Middleware } from "../../../messaging/core/middleware";
import { SendEffect } from "../../../messaging/core/lib/send";

export type Environment = {
    /** The address of the environment */
    address: Address;
    /** From the outside world "inside out env" send a message to the system */
    send: SendEffect;
    /** Remove the environment + Address from the system */
    remove: Effect.Effect<void, never, never>,
    /** Use a middleware in the environment address */
    useMiddleware: (middleware: Middleware) => Effect.Effect<void, never, never>,
    // is_active: () => boolean
}

export class EnvironmentT extends Context.Tag("EnvironmentT")<EnvironmentT, Environment>() { }
/*export class EnvironmentInactiveError extends Data.TaggedError("EnvironmentInactiveError")<{
    address: Address;
}> { }*/