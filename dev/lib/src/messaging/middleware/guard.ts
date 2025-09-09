
import { Message } from "../base/message";
import { Middleware, MiddlewareContinue } from "../base/middleware";

export function guard_middleware(
    middleware: Middleware,
    guard: (message: Message) => boolean | Promise<boolean>
): Middleware {
    return async (message: Message) => {
        if (await guard(message)) {
            return await middleware(message);
        }
        return MiddlewareContinue;
    }
}

export function guard_incoming(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message) => message.local_data.direction == "incoming"
    );
}

export function guard_outgoing(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message) => message.local_data.direction == "outgoing"
    );
}

export function guard_at_target(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message) => message.local_data.at_target
    );
}

export function guard_at_source(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message) => message.local_data.at_source
    );
}

export function guard_at_source_or_target(middleware: Middleware): Middleware {
    return guard_middleware(
        middleware,
        (message: Message) => message.local_data.at_source || message.local_data.at_target
    );
}