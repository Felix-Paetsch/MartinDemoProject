import { Effect } from "effect";
import { LocalComputedMessageData } from "../base/local_computed_message_data";
import { Message } from "../base/message";
import { Middleware, MiddlewareContinue } from "../base/middleware";

export function guard_middleware(
    middleware: Middleware,
    guard: (message: Message, lcmd: LocalComputedMessageData) => Effect.Effect<boolean, never>
): Middleware {
    return Effect.fn("guard_middleware")(
        function* (message: Message, lcmd: LocalComputedMessageData) {
            if (yield* guard(message, lcmd)) {
                return yield* middleware(message, lcmd);
            }
            return MiddlewareContinue;
        });
}

export function guard_incoming(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message, lcmd: LocalComputedMessageData) =>
            Effect.succeed(lcmd.direction == "incoming")
    );
}

export function guard_outgoing(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message, lcmd: LocalComputedMessageData) =>
            Effect.succeed(lcmd.direction == "outgoing")
    );
}

export function guard_at_target(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message, lcmd: LocalComputedMessageData) =>
            Effect.succeed(lcmd.at_target)
    );
}

export function guard_at_source(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message, lcmd: LocalComputedMessageData) =>
            Effect.succeed(lcmd.at_source)
    );
}

export function guard_at_source_or_target(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message, lcmd: LocalComputedMessageData) =>
            Effect.succeed(lcmd.at_source || lcmd.at_target)
    );
}