import { Data, Effect, Option, Schema } from "effect";
import { Json } from "../../utils/json";
import { Address, Message, Middleware, Port } from "../../messaging/exports";
import { chain_middleware, ChainMessageResultT, make_message_chain } from "../message_chains";
import { ProtocolCommunicationHandler } from "./base/communicationHandler";
import { ProtocolError, ProtocolErrorN } from "./base/protocol_errors";
import { get_protocol_meta_data, to_protocol_message } from "./base/protocol_message";

const ProtocolMetaDataSchema = Schema.Struct({
    protocol_name: Schema.String,
    protocol_ident: Schema.Any,
    protocol_version: Schema.String,
    is_error: Schema.optionalWith(Schema.Boolean, {
        default: () => false
    })
});

export abstract class Protocol<SenderResult, ReceiverResult> {
    constructor(
        readonly port: Port,
        readonly protocol_name: string,
        readonly protocol_ident: Json,
        readonly protocol_version: string
    ) { }

    abstract on_first_request(
        pch: ProtocolCommunicationHandler
    ): Effect.Effect<void, ProtocolError>;

    send_first_message(target_address: Address,
        data: Json,
        timeout?: number,
        source_address: Address = Address.local_address
    ) {
        return Effect.gen(this, function* () {
            const message = new Message(target_address, {
                data
            });

            message.meta_data.protocol = this.protocol_meta_data;
            const responseE = yield* make_message_chain(message, timeout, source_address)

            yield* Effect.tryPromise(() => this.port.send(message));

            return responseE.pipe(
                Effect.andThen(response => to_protocol_message(response, this.protocol_meta_data)),
                Effect.andThen(protocolMessage => new ProtocolCommunicationHandler(protocolMessage)),
                Effect.catchAll(e => Effect.gen(function* () {
                    if (e instanceof ProtocolError) {
                        return yield* e;
                    }

                    return yield* ProtocolErrorN({
                        error: e
                    })
                }))
            )
        }).pipe(Effect.withSpan("SendFirstMessage"))
    }

    protected get protocol_meta_data(): typeof ProtocolMetaDataSchema.Type {
        return Data.struct({
            protocol_name: this.protocol_name,
            protocol_ident: this.protocol_ident,
            protocol_version: this.protocol_version,
            is_error: false
        })
    }

    abstract run(address: Address, data: Json): Effect.Effect<SenderResult, ProtocolError>;

    on(cb: (result: ReceiverResult) => Effect.Effect<void, never, never>): void {
        this._on_callback = cb;
    }
    _on_callback: (result: ReceiverResult) => Effect.Effect<void, never, never> = () => Effect.void;

    /** The middleware to register on both sides to make this work */

    middleware(
        this: Protocol<SenderResult, ReceiverResult>
    ) {
        const self = this;
        const on_first_msg = Effect.gen(
            function* () {
                const res = yield* ChainMessageResultT;
                const pm = yield* to_protocol_message(res, self.protocol_meta_data);
                const phc = new ProtocolCommunicationHandler(pm);
                return yield* self.on_first_request(phc);
            }
        ).pipe(Effect.withSpan("on_first_request_mw"))

        return chain_middleware(
            () => on_first_msg.pipe(
                Effect.tapError(e => Effect.logError(e)),
                Effect.ignore
            ),
            (message: Message) => Effect.gen(
                this, function* () {
                    const meta_data = message.meta_data;
                    const protocol_meta_data = yield* get_protocol_meta_data(meta_data)

                    if (Option.isNone(protocol_meta_data)) {
                        return false
                    }

                    return (
                        protocol_meta_data.value.protocol_name === this.protocol_meta_data.protocol_name
                        && protocol_meta_data.value.protocol_ident === this.protocol_meta_data.protocol_ident
                        && protocol_meta_data.value.protocol_version === this.protocol_meta_data.protocol_version
                    )
                }
            ).pipe(Effect.withSpan("middleware_should_process_message"))
        )
    };

    request_middleware = Effect.fn("request_middleware")(
        function* (
            this: Protocol<SenderResult, ReceiverResult>,
            send: SendEffect = kernel_send
        ) {
            return guard_middleware(
                this.middleware(send),
                Effect.fn("request_middleware_guard")(
                    function* (msg: Message) {
                        const length = (msg.meta_data.chain_message as any)?.current_msg_chain_length || -1;
                        return length % 2 == 0
                    })
            )
        })

    response_middleware = Effect.fn("response_middleware")(
        function* (
            this: Protocol<SenderResult, ReceiverResult>,
            send: SendEffect = kernel_send
        ) {
            return guard_middleware(
                this.middleware(send),
                Effect.fn("request_middleware_guard")(
                    function* (msg: Message) {
                        const length = (msg.meta_data.chain_message as any)?.current_msg_chain_length || -1;
                        return length % 2 == 1
                    })
            )
        })
}
