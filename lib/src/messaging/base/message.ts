import { Context, Data, Effect, ParseResult, pipe, Schema } from "effect";
import { Json } from "../../utils/json";
import { Address } from "./address";

export class MessageT extends Context.Tag("MessageT")<
    MessageT,
    Message
>() { }

export class MessageSerializationError extends Data.TaggedError("MessageSerializationError")<{
    message: Message
}> { }
export class MessageDeserializationError extends Data.TaggedError("MessageDeserializationError")<{}> { }

export type SerializedMessage = string & { readonly __brand: "SerializedMessage" };
export class SerializedMessageT extends Context.Tag("SerializedMessageT")<SerializedMessageT, SerializedMessage>() { }
export type MessageContent = {
    serialized: string | null,
    deserialized: { [key: string]: Json } | null
}

const deserialized_schema = Schema.Record({
    key: Schema.String,
    value: Schema.Any
});
const transform_message_content = Schema.parseJson(deserialized_schema);

export class Message {
    private msg_content: MessageContent;

    constructor(
        public target: Address,
        content: string | { [key: string]: Json }, // Is string, we assume it is serialized { key: Json }
        public meta_data: { [key: string]: Json } = {}
    ) {
        if (typeof content === "string") {
            this.msg_content = { serialized: content, deserialized: null };
        } else {
            this.msg_content = { serialized: null, deserialized: content };
        }
    }

    serialize(): SerializedMessage {
        return Schema.encodeSync(Message.MessageFromString)(this) as SerializedMessage;
    }

    static deserialize(serialized: SerializedMessage): Effect.Effect<Message, MessageDeserializationError> {
        return Schema.decode(Message.MessageFromString)(serialized)
            .pipe(
                Effect.mapError(() => new MessageDeserializationError())
            )
    }

    get serialized_content(): Effect.Effect<string> {
        const this_msg = this;
        return Effect.gen(function* () {
            if (this_msg.msg_content.serialized === null) {
                if (this_msg.msg_content.deserialized === null) {
                    return yield* Effect.die("Both serialized and deserialized are null");
                }

                const serialized = Schema.encodeSync(transform_message_content)(this_msg.msg_content.deserialized);
                this_msg.msg_content.serialized = serialized;
            }

            return this_msg.msg_content.serialized!;
        });
    }

    get content(): Effect.Effect<{ [key: string]: Json }, MessageDeserializationError> {
        const this_msg = this;
        return Effect.gen(function* () {
            if (this_msg.msg_content.deserialized === null) {
                if (this_msg.msg_content.serialized === null) {
                    return yield* Effect.dieMessage("Both serialized and deserialized are null");
                }

                const deserialized = yield* Schema.decode(transform_message_content)(this_msg.msg_content.serialized);
                this_msg.msg_content.deserialized = deserialized;
            }

            return this_msg.msg_content.deserialized!;
        }).pipe(Effect.mapError(() => new MessageDeserializationError()));
    }

    get content_string(): Effect.Effect<string> {
        if (this.msg_content.serialized) {
            return Effect.succeed(this.msg_content.serialized!);
        }
        return Schema.encode(transform_message_content)(this.msg_content.deserialized!).pipe(
            Effect.orDie
        );
    }

    static content(msg: Message | string) {
        return Effect.gen(function* () {
            if (typeof msg === "string") {
                const msg_obj = yield* Message.deserialize(msg as SerializedMessage);
                return yield* msg_obj.content;
            }

            return yield* msg.content;
        });
    }

    static MessageFromString = Schema.transformOrFail(Schema.String, Schema.instanceOf(Message), {
        decode: (str: string, _, ast) =>
            pipe(
                Effect.try(() => JSON.parse(str)),
                Effect.catchAll(e => {
                    return ParseResult.fail(
                        new ParseResult.Type(ast, str, `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`)
                    );
                }),
                Effect.andThen((json) => Effect.gen(function* () {
                    const target_str = yield* Schema.decode(Schema.String)(json.target);
                    const content = yield* Schema.decode(Schema.String)(json.content);
                    const meta_data = yield* Schema.decode(Schema.Record({
                        key: Schema.String,
                        value: Schema.Any
                    }))(json.meta_data);
                    const target = yield* Schema.decode(Address.AddressFromString)(target_str);
                    return new Message(target, content, meta_data)
                })),
                Effect.catchAll(e => {
                    return ParseResult.fail(
                        new ParseResult.Type(ast, str, `Failed deserializing message: ${e instanceof Error ? e.message : String(e)}`));
                })
            ),
        encode: (msg: Message) =>
            pipe(
                msg.serialized_content,
                Effect.andThen(serialized_content =>
                    JSON.stringify({
                        target: Schema.encodeSync(Address.AddressFromString)(msg.target),
                        content: serialized_content,
                        meta_data: msg.meta_data
                    })
                )
            )
    });

    as_transmittable() {
        return new TransmittableMessage(this);
    }
}


export class TransmittableMessage {
    constructor(
        private msg: Message | SerializedMessage,
        private addr: Address | null = null
    ) { }

    content: Effect.Effect<{ [key: string]: Json }, MessageDeserializationError> =
        this.message.pipe(Effect.flatMap(msg => msg.content));

    has_deserialized_message(): boolean {
        return this.msg instanceof Message;
    }

    static from_unknown(str: any): Effect.Effect<TransmittableMessage, MessageDeserializationError> {
        return Effect.gen(function* () {
            if (str instanceof Message || typeof str === "string") {
                return new TransmittableMessage(str as Message | SerializedMessage);
            }

            return yield* new MessageDeserializationError();
        })
    }

    get message(): Effect.Effect<Message, MessageDeserializationError> {
        const self = this;
        return Effect.gen(function* () {
            if (self.msg instanceof Message) {
                return self.msg;
            }

            self.msg = yield* Message.deserialize(self.msg);
            return self.msg;
        })
    }

    get string(): SerializedMessage {
        if (this.msg instanceof Message) {
            return this.msg.serialize();
        }

        return this.msg;
    }

    get address(): Effect.Effect<Address, MessageDeserializationError> {
        const self = this;
        return Effect.gen(function* () {
            if (typeof self.msg === "string" && self.addr) {
                return self.addr;
            }

            return yield* self.message.pipe(Effect.map(msg => msg.target));
        })
    }
}

export class TransmittableMessageT extends Context.Tag("TransmittableMessageT")<TransmittableMessageT, TransmittableMessage>() { }