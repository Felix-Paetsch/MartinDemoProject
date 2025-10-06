import { Address, Message, Port } from "../../messaging/exports";
import uuidv4 from "../../utils/uuid";
import { MessageDataEncoded } from "./schemas";
import { SendMessageBodySchema } from "./schemas/send";
import { Deferred, Duration, Effect, Schedule, Schema } from "effect";
import { MessageChannelInitializationContextEncoded, MessageChannelInitializationContextWithId } from "./schemas/context";
import { MessageChannelConfig, MessageChannelConfigEncoded, MessageChannelConfigSchema } from "./schemas/config";
import { OpenChannelBodySchema } from "./schemas/open";
import { Json } from "../../utils/json";
import { CloseMessageBodySchema } from "./schemas/close";
import { processMessageChannelMessage } from "./middleware";
import { Transcoder } from "../../utils/exports";

export type receiveMessageError = Error;

export type MessageChannelProcessorName = string;
export type ChannelMessage = Json;
export type MessageChannelCloseReason = "PortIsClosed" | "ChannelLocallyClosed" | "ChannelRemotelyClosed" | "InactiveTimeout";

export type MessageChannelProcessor = (m: MessageChannel) => void | Promise<void>;

export default class MessageChannel {
    private _is_open = true;
    private _close_reason: MessageChannelCloseReason | null = null;
    private _on_close: (reason: MessageChannelCloseReason) => void | Promise<void> = () => { };
    private message_queue: ChannelMessage[] = [];
    private message_promise_queue: [string, (message: ChannelMessage) => void][] = [];
    private _inactivity_timeout: NodeJS.Timeout | null = null;
    public readonly config: MessageChannelConfig;
    public last_message_received: number = Date.now();

    public readonly context: MessageChannelInitializationContextWithId;
    constructor(
        public readonly partner: Address,
        public readonly port: Port,
        context: MessageChannelInitializationContextEncoded,
        config: MessageChannelConfigEncoded = {}
    ) {
        if (!context.id) { (context as any).id = uuidv4(); }
        this.context = context as MessageChannelInitializationContextWithId;
        this.config = Schema.decodeSync(MessageChannelConfigSchema)(config);

        if (!context.remotely_initialized) {
            const first_message = Schema.encodeSync(OpenChannelBodySchema)({
                type: "OpenNewChannel",
                context: {
                    ...this.context,
                    remotely_initialized: true
                },
                address: this.port.address,
                config: this.config,
            });
            this.#send_message(first_message);
        }

        if (this.is_open()) MessageChannel.open_channels.push(this);
        this.#startInactivityTimeout();
    }

    static open_channels: MessageChannel[] = [];
    static processors: Map<MessageChannelProcessorName, MessageChannelProcessor> = new Map();

    #closeWithReason(reason: MessageChannelCloseReason) {
        // Error: From callback
        if (!this._is_open) { return; }
        this._is_open = false;
        this.#clearInactivityTimeout();
        if (["ChannelLocallyClosed"].includes(reason)) {
            this.#send_message(Schema.encodeSync(CloseMessageBodySchema)({
                type: "CloseChannel",
                targetID: this.context.id
            }));
        }
        return Promise.resolve(this._on_close(reason));
    }

    #startInactivityTimeout() {
        this.#clearInactivityTimeout();
        if (this.config.timeoutAfterInactivity > 0) {
            this._inactivity_timeout = setTimeout(() => {
                if (this._is_open) {
                    this.#closeWithReason("InactiveTimeout");
                }
            }, this.config.timeoutAfterInactivity);
        }
    }

    #clearInactivityTimeout() {
        if (this._inactivity_timeout) {
            clearTimeout(this._inactivity_timeout);
            this._inactivity_timeout = null;
        }
    }
    close() {
        return Promise.resolve(this.#closeWithReason("ChannelLocallyClosed"));
    }
    on_close(cb: (reason: MessageChannelCloseReason) => void | Promise<void>) { this._on_close = cb; }
    is_closed() { return !this.is_open(); }
    is_open() {
        if (this._is_open && this.port.is_closed()) {
            this.#closeWithReason("PortIsClosed");
        }
        return this._is_open;
    }
    get close_reason() { return this._close_reason; }

    send(data: ChannelMessage) {
        // Ignoring if port is closed
        return this.#send_message(Schema.encodeSync(SendMessageBodySchema)({
            type: "SendMessage",
            data,
            targetID: this.context.id
        }));
    }

    async send_await_next(data: ChannelMessage) {
        await this.send(data);
        return await this.next();
    }

    next(timeout?: number): Promise<ChannelMessage | receiveMessageError> {
        return Effect.gen(this, function* () {
            if (this.message_queue.length > 0) {
                return this.message_queue.shift()!;
            }

            if (this.is_closed()) {
                return yield* Effect.fail(new Error("Message channel is closed"));
            }

            const key = uuidv4();
            const deferred = yield* Deferred.make<ChannelMessage, receiveMessageError>();
            const effectiveTimeout = Math.min(timeout || this.config.defaultMessageTimeout || 2000, 60000);
            const timeout_duration = Duration.millis(effectiveTimeout);
            const deferred_with_timeout = Deferred.await(deferred).pipe(
                Effect.timeout(timeout_duration),
                Effect.mapError(() => new Error("Message channel timeout"))
            );

            this.message_promise_queue.push([key, (message: ChannelMessage) => {
                const index = this.message_promise_queue.findIndex(p => p[0] === key);
                if (index !== -1) {
                    this.message_promise_queue.splice(index, 1);
                }
                Deferred.succeed(deferred, message).pipe(Effect.runPromise);
            }]);

            yield* Schedule.run(
                Schedule.addDelay(Schedule.once, () => timeout_duration),
                Date.now(),
                Effect.sync(() => {
                    const index = this.message_promise_queue.findIndex(p => p[0] === key);
                    if (index !== -1) {
                        this.message_promise_queue.splice(index, 1);
                    }
                })
            )

            return yield* deferred_with_timeout;
        }).pipe(
            Effect.merge,
            Effect.runPromise
        )
    }

    async send_encoded<R>(encoder: Transcoder.Encoder<R, any>, data: R) {
        const r = await encoder.encode(data);
        if (r instanceof Error) return r;
        return await this.send(r);
    }

    async next_decoded<R>(decoder: Transcoder.Decoder<R, any>) {
        const r = await this.next();
        if (r instanceof Error) return r;
        return await decoder.decode(r);
    }


    async send_await_next_transcoded<R, S>(EncodeSend: Transcoder.Encoder<R, any>, data: R, DecodeNext: Transcoder.Decoder<S, any>) {
        const r1 = await EncodeSend.encode(data);
        if (r1 instanceof Error) return r1;
        const r2 = await this.send_await_next(r1);
        if (r2 instanceof Error) return r2;
        return await DecodeNext.decode(r2);
    }

    static register_processor(name: MessageChannelProcessorName, processor: MessageChannelProcessor) {
        MessageChannel.processors.set(name, processor);
    }

    static get_processor(processor: MessageChannelProcessorName) {
        return MessageChannel.processors.get(processor) || null;
    }

    static remove_processor(processor: MessageChannelProcessorName) {
        MessageChannel.processors.delete(processor);
    }

    #send_message(body: MessageDataEncoded) {
        if (!this.is_open()) { return Promise.resolve(); }
        return this.port.send(new Message(this.partner, body, {
            "message_channel_middleware": this.context.id,
        }));
    }

    __on_message(message: ChannelMessage) {
        this.last_message_received = Date.now();
        this.#startInactivityTimeout();
        if (this.message_promise_queue.length > 0) {
            const [_key, resolve] = this.message_promise_queue.shift()!;
            return resolve(message);
        }
        this.message_queue.push(message);
    }

    __closed_remotely() {
        this.#closeWithReason("ChannelRemotelyClosed");
    }

    static middleware = processMessageChannelMessage;

// Compare Effect stream API
// Compare Socket API
// Errors
// Direct responses to messages - and there errors (?)
}
