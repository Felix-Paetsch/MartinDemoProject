import { Cause, Data, Effect, Schema, pipe } from "effect";
import { Json } from "../../../utils/json";
import { Address } from "../../base/address";
import { ProtocolMessage } from "./protocol_message";

export class ProtocolError extends Data.TaggedError("ProtocolError")<{
    message: string;
    error?: Error;
    data?: Json;
    Message?: ProtocolMessage;
}> {
    readonly msg_stack: string[] = [];
    constructor(args: {
        message: string,
        data?: Json,
        error?: Error,
        Message?: ProtocolMessage,
        stack?: string
    }) {
        if (args.error instanceof ProtocolError) {
            args.message && args.error.causing(args.message);
            args.error.update_message();
            return args.error;
        }
        super(args);

        args.message && this.msg_stack.push(args.message);
        (this as any).stack = args.stack || this.message;
        this.update_message();
    }

    caused_by(m: string | Error) {
        if (m instanceof Error) {
            this.msg_stack.push(m.message || m.name);
            return
        }

        m && this.msg_stack.push(m);
    }

    causing(m: string | Error) {
        if (m instanceof Error) {
            this.msg_stack.unshift(m.message || m.name);
            return
        }

        m && this.msg_stack.unshift(m);
    }

    update_message() {
        (this as any).message = this.msg_stack.join(" < ");
        this.update_stack();
    }

    update_stack() {
        const old_stack = this.stack;
        if (!old_stack) return (this as any).stack = `${this.name}: ${this.message}`

        const lines = old_stack.split("\n");
        lines[0] = `${this.name}: ${this.message}`;
        (this as any).stack = lines.join("\n");
    }

    toString(): string {
        return this.stack || `${this.name}: ${this.message}`;
    }

    serialize() {
        return Schema.encodeSync(ProtocolError.ProtocolErrorFromJson)(this);
    }

    to_protocolErrorR(protocol_message: ProtocolMessage) {
        return ProtocolErrorR({
            message: this.message,
            error: this.error,
            data: this.data,
            Message: protocol_message
        })
    }

    to_json() {
        return {
            message: this.message,
            stack: this.stack,
            data: this.data,
            source: this.Message?.source || "<anonymous>"
        }
    }

    static ProtocolErrorFromJson = Schema.transformOrFail(
        Schema.Struct({
            msg_stack: Schema.Array(Schema.String),
            stack: Schema.String,
            data: Schema.optionalWith(Schema.Any, { default: () => null }),
            source: Schema.Union(
                Schema.String,
                Schema.instanceOf(Address)
            )
        }),
        Schema.instanceOf(ProtocolError), {
        decode: (serialized) => Effect.gen(function* () {
            const lines = serialized.stack.split("\n");
            let source: string;
            if (serialized.source instanceof Address) {
                source = `<${serialized.source.primary_id}, ${serialized.source.secondary_id}>`
            } else {
                source = serialized.source
            }

            const local_stack = yield* computeLocalStack;
            const new_stack = [
                "<toUpdateLine>",
                `  [local stack trace]`,
                ...local_stack.split("\n").slice(2),
                `  [caused by external at ${source}]`,
                ...lines.slice(1)
            ];

            const e = new ProtocolError({
                message: "",
                data: serialized.data as Json,
                stack: new_stack.join("\n")
            });

            e.msg_stack.push("External", ...serialized.msg_stack);
            e.update_message();

            return e;
        }),
        encode: (err: ProtocolError) => Effect.succeed({
            msg_stack: err.msg_stack,
            data: err.data || null,
            stack: err.stack || `${err.name}: ${err.message}`,
            source: err.Message?.source || "<anonymous>"
        })
    })

    static throwIfRespondedWithError = Effect.fn("throwIfRespondedWithError")(
        function* (protocol_message: ProtocolMessage) {
            if (!(protocol_message.meta_data.protocol as any).is_error) {
                return yield* Effect.void;
            }

            return yield* Schema.decodeUnknown(ProtocolError.ProtocolErrorFromJson)(protocol_message.data).pipe(
                Effect.catchAll(e => ProtocolErrorN({
                    message: "Invalid response error format",
                    error: e
                })),
                Effect.andThen(e => Effect.fail(e))
            )
        })
}

export const ProtocolErrorN = Effect.fn("ProtocolErrorN")(function* (args: {
    message?: string,
    data?: Json,
    error?: Error,
    Message?: ProtocolMessage
}) {
    let local_stack: string;
    if (!args.error || args.error instanceof Data.Error) {
        local_stack = (yield* computeLocalStack).split("\n").slice(2).join("\n")
    } else {
        local_stack = args.error.stack || "";
    }
    const pError = new ProtocolError({
        ...args,
        message: "",
        stack: local_stack
    });
    if (args.error && !(args.error instanceof ProtocolError)) {
        pError.causing(args.error);
    }
    if (args.message) {
        pError.causing(args.message);
    }

    pError.update_message();
    return yield* pError;
})

export const ProtocolErrorR = Effect.fn("ProtocolErrorR")(function* (args: {
    message?: string,
    data?: Json,
    error?: Error,
    Message: ProtocolMessage
}) {
    return yield* ProtocolErrorN(args).pipe(
        Effect.tapError(e => Effect.gen(function* () {
            if (args.Message && !args.Message.has_responded) {
                args.Message.respond_error(e).pipe(
                    Effect.runPromise
                );
            }
        }))
    );
})

export const fail_as_protocol_error = Effect.catchAll(e => Effect.gen(function* () {
    if (e instanceof ProtocolError) {
        return yield* e;
    }

    if (e instanceof Error) {
        return yield* ProtocolErrorN({ error: e })
    }

    return yield* ProtocolErrorN({ error: new Error(String(e)) })
}))

export const fail_with_response = <A, R>(e: Effect.Effect<A, unknown, R>, protocol_message: ProtocolMessage) => pipe(
    e,
    fail_as_protocol_error,
    Effect.catchTag("ProtocolError", e => Effect.gen(function* () {
        return yield* e.to_protocolErrorR(protocol_message);
    }))
)

export const not_implemented_error = (protocol_message: ProtocolMessage) => Effect.gen(function* () {
    return yield* ProtocolErrorR(
        {
            message: "Not implemented",
            data: {},
            Message: protocol_message
        }
    )
})

const computeLocalStack = Effect.gen(function* () {
    let local_stack = "";
    yield* Effect.fail(new Error("testing")).pipe(
        Effect.catchAllCause(c => Effect.gen(function* () {
            const r = Cause.prettyErrors(c);
            local_stack = r[0]!.stack || "";
        }))
    );
    return local_stack;
})