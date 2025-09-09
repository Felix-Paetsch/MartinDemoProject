import { Context, Data, Deferred, Duration, Effect, Schedule, Schema } from "effect";
import { v4 as uuidv4 } from 'uuid';
import { Address } from "../base/address";
import { Message } from "../base/message";
import { Middleware, MiddlewareContinue, MiddlewareInterrupt, EffectToMiddleware } from "../base/middleware";
import { send as kernel_send, SendEffect } from "../base/send";
import { Json } from "../../utils/json";
import { guard_at_target } from "./guard";

export const chain_message_schema = Schema.Struct({
    current_sender: Address.AddressFromString,
    current_reciever: Address.AddressFromString,
    msg_chain_uid: Schema.String,
    current_msg_chain_length: Schema.Number,
    timeout: Schema.Number,
    created_at: Schema.DateFromNumber
});

export class ChainTimeout extends Data.TaggedError("ChainTimeout")<{
    timeout: number;
    msg_chain_uid: string;
}> { }

export type ChainMessageResult = {
    message: Message,
    respond: ResponseFunction,
    source: Address
}

export class ChainMessageResultT extends Context.Tag("ChainMessageResultT")<
    ChainMessageResultT,
    ChainMessageResult
>() { }

export class MessageTransmissionError extends Data.TaggedError("MessageTransmissionError")<{
    error: Error;
}> { }

export class InvalidMessageFormatError extends Data.TaggedError("InvalidMessageFormatError")<{
    Message: Message;
    error: Error;
    message: string;
}> { }

export type ChainContinueEffect = Effect.Effect<
    Effect.Effect<ChainMessageResult, ChainTimeout, never>,
    MessageTransmissionError | InvalidMessageFormatError,
    never
>;

export type ResponseFunction = (
    content: { [key: string]: Json },
    meta_data: { [key: string]: Json },
    new_timeout?: number,
    send?: SendEffect
) => ChainContinueEffect;

export class ResponseFunctionT extends Context.Tag("ResponseFunctionT")<
    ResponseFunctionT,
    ResponseFunction
>() { }

const chain_queue: {
    [key: string]: {
        last_message: Message,
        on_chain_message_result: (cmr: ChainMessageResult) => Effect.Effect<void, never, never>
    }
} = {};

export const make_message_chain = Effect.fn("make_message_chain")(
    function* (
        message: Message,
        timeout: number = 5000,
        current_sender: Address = Address.local_address
    ) {
        const chain_uid = uuidv4();
        message.meta_data.chain_message = yield* Schema.encode(chain_message_schema)({
            current_sender: current_sender,
            current_reciever: message.target,
            msg_chain_uid: chain_uid,
            current_msg_chain_length: 1,
            timeout: timeout,
            created_at: new Date()
        }).pipe(Effect.orDie);

        return yield* make_chain_message_promise(message, chain_uid, timeout);
    });

function get_message_promise_key(msg_chain_uid: string, current_msg_chain_length: number, send: "send" | "recieve") {
    return `${msg_chain_uid}_${send === "send" ? current_msg_chain_length : current_msg_chain_length - 1}`;
}

const make_chain_message_promise = Effect.fn("make_chain_message_promise")(
    function* (message: Message, chain_uid: string, timeout: number) {
        const key = get_message_promise_key(chain_uid, (message as any).meta_data?.chain_message?.current_msg_chain_length ?? 0, "send");
        const deferred = yield* Deferred.make<ChainMessageResult, never>();
        const timeout_duration = Duration.millis(timeout);
        const deferred_with_timeout = Deferred.await(deferred).pipe(
            Effect.timeout(timeout_duration),
            Effect.mapError(() => new ChainTimeout({
                timeout: timeout,
                msg_chain_uid: chain_uid
            }))
        );

        chain_queue[key] = {
            last_message: message,
            on_chain_message_result: (cmr: ChainMessageResult) => {
                return Deferred.succeed(deferred, cmr);
            }
        }

        yield* Schedule.run(
            Schedule.addDelay(Schedule.once, () => timeout_duration),
            Date.now(),
            Effect.sync(() => delete chain_queue[key])
        )

        return deferred_with_timeout;
    });

export const chain_middleware = (
    on_first_request: (message: Message) => Effect.Effect<void, never, ResponseFunctionT | ChainMessageResultT>,
    should_process_message: (message: Message) => Effect.Effect<boolean, never>
) => guard_at_target(
    EffectToMiddleware(Effect.fn("chain_middleware")(
        function* (message: Message) {
            const chain_message = message.meta_data.chain_message;
            if (
                typeof chain_message === "undefined"
                || !message.local_data.at_target
                || !(yield* should_process_message(message))
            ) {
                return MiddlewareContinue;
            }

            const data = yield* Schema.decodeUnknown(chain_message_schema)(chain_message).pipe(
                Effect.mapError((e) => new InvalidMessageFormatError({
                    Message: message,
                    error: e,
                    message: "Chain message meta data has wrong format."
                }))
            );

            const continue_chain = continue_chain_fn(data);
            const chain_message_context = Context.empty().pipe(
                Context.add(ChainMessageResultT, {
                    message: message,
                    respond: continue_chain,
                    source: data.current_sender
                }),
                Context.add(ResponseFunctionT, continue_chain)
            );

            const promise_key = get_message_promise_key(data.msg_chain_uid, data.current_msg_chain_length, "recieve");

            if (data.current_msg_chain_length === 1) {
                yield* on_first_request(message).pipe(
                    Effect.provide(chain_message_context)
                );
            } else if (chain_queue[promise_key]) {
                yield* chain_queue[promise_key].on_chain_message_result({
                    message: message,
                    respond: continue_chain,
                    source: data.current_sender
                });
            }

            return MiddlewareInterrupt;
        }, e => e.pipe(
            Effect.withSpan("chain_middleware"),
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore
        )
    ))
)

const continue_chain_fn = (request_chain_message_meta_data: typeof chain_message_schema.Type): ResponseFunction => {
    return Effect.fn("ResponseFunction")(
        function* (
            content: { [key: string]: Json },
            meta_data: { [key: string]: any } = {},
            new_timeout?: number,
            send: SendEffect = kernel_send
        ) {
            const {
                current_sender,
                current_reciever,
                msg_chain_uid,
                current_msg_chain_length,
                timeout,
                created_at
            } = request_chain_message_meta_data;

            const res = new Message(current_sender, content, {
                ...meta_data,
                chain_message: yield* Schema.encode(chain_message_schema)({
                    current_sender: current_reciever,
                    current_reciever: current_sender,
                    msg_chain_uid: msg_chain_uid,
                    current_msg_chain_length: current_msg_chain_length + 1,
                    timeout: new_timeout ?? timeout,
                    created_at: created_at
                }).pipe(Effect.orDie)
            });

            const prom = yield* make_chain_message_promise(res, msg_chain_uid, new_timeout ?? timeout);
            yield* send(res).pipe(Effect.ignore);

            return prom;
        });
}

export const id_chain_middleware = (
    on_first_request: (message: Message) => Effect.Effect<void, never, ResponseFunctionT | ChainMessageResultT>,
    id: string,
    should_process_message: (message: Message) => Effect.Effect<boolean, never> = () => Effect.succeed(true)
): Middleware & {
    make_message_chain: (message: Message, timeout?: number, current_sender?: Address) => Effect.Effect<Message, ChainTimeout>
} => {
    const mw = chain_middleware(
        on_first_request,
        Effect.fn("id_chain_middleware_should_process_message")(
            function* (message: Message) {
                return (message.meta_data as any).chain_message?.chain_middleware_id === id
                    && (yield* should_process_message(message));
            })
    );

    const make_id_chain_message = (message: Message, timeout?: number, current_sender?: Address) => {
        const r = make_message_chain(message, timeout, current_sender);
        const chain_message = (message.meta_data as any).chain_message;
        if (typeof chain_message === "object" && chain_message !== null) {
            chain_message.chain_middleware_id = id;
        }
        return r;
    }

    (mw as any).make_message_chain = make_id_chain_message;
    return mw as Middleware & {
        make_message_chain: (message: Message, timeout?: number, current_sender?: Address) => Effect.Effect<Message, ChainTimeout>
    };
}