import { Context, Effect } from "effect";
import { Json } from "../../../utils/json";
import { Address } from "../../base/address";
import { MessageTransmissionError } from "../../base/errors/message_errors";
import { not_implemented_error, ProtocolError, ProtocolErrorN, ProtocolErrorR } from "./protocol_errors";
import { ProtocolMessage } from "./protocol_message";

export class ProtocolCommunicationHandlerT extends Context.Tag("ProtocolCommunicationHandlerT")<ProtocolCommunicationHandlerT, ProtocolCommunicationHandler>() { }

export class ProtocolCommunicationHandler {
    readonly communication_target: Address;
    constructor(
        public __current_pm: ProtocolMessage
    ) {
        this.communication_target = Address.deserializeFromUnkown((this.__current_pm.meta_data.chain_message as any)?.current_sender || null).pipe(
            Effect.orDie,
            Effect.runSync
        );
    }

    respond(data: Json, timeout?: number) {
        return Effect.gen(this, function* () {
            return yield* this.__current_pm.respond(data, timeout);
        }).pipe(
            Effect.withSpan("respond")
        )
    }

    send = Effect.fn("send")(
        function* (this: ProtocolCommunicationHandler, data: Json, timeout?: number) {
            const pmE = yield* this.respond(data, timeout);
            return pmE.pipe(
                Effect.andThen(pm => {
                    this.__current_pm = pm;
                    return pm;
                }),
                Effect.as(this),
                Effect.onError(_ => this.errorCleanUp())
            );
        }, (e) => e.pipe(Effect.onError(_ => this.errorCleanUp())))

    finishExternal = Effect.fn(
        function* (this: ProtocolCommunicationHandler, data: Json = "OK") {
            return yield* this.send(data, 0);
        }
    )

    close(data: Json, ignore: false): Effect.Effect<void, ProtocolError | MessageTransmissionError>;
    close(data: Json, ignore: true): Effect.Effect<void>;
    close(data: Json = "OK", ignore: boolean = false) {
        const res = this.respond(data, 0).pipe(Effect.withSpan("close"));
        // @effect-diagnostics-next-line effectInVoidSuccess:off
        return !ignore ? res : res.pipe(Effect.ignore)
    }

    awaitResponse: (data?: Json, timeout?: number) => Effect.Effect<ProtocolCommunicationHandler, ProtocolError | MessageTransmissionError> = Effect.fn("awaitResponse")(
        function* (this: ProtocolCommunicationHandler, data: Json = "OK", timeout?: number) {
            const pm = yield* yield* this.respond(data, timeout);
            this.__current_pm = pm;
            return this;
        },
        e => e.pipe(Effect.onError(_ => this.errorCleanUp()))
    )

    not_implemented_error() {
        return not_implemented_error(this.__current_pm).pipe(
            Effect.withSpan("not_implemented_error")
        );
    }

    private errorCleanUp() {
        return Effect.all(this.error_handlers, {
            mode: "either"
        }).pipe(
            Effect.withSpan("errorCleanUp")
        );
    }

    private error_handlers: Effect.Effect<void, never, never>[] = [];
    onMessageError(e: Effect.Effect<void, never, never>) {
        this.error_handlers.push(e);
    }

    get data(): Json {
        return this.__current_pm.data;
    }

    get message(): ProtocolMessage {
        return this.__current_pm;
    }

    errorN(obj: {
        message?: string;
        data?: Json;
        error?: Error
    }) {
        return ProtocolErrorN({
            message: obj.message,
            data: obj.data,
            error: obj.error
        })
    }
    errorR(obj: {
        message?: string;
        data?: Json;
        error?: Error
    }) {
        return ProtocolErrorR({
            message: obj.message,
            data: obj.data,
            error: obj.error,
            Message: this.__current_pm
        })
    }
    asErrorR<E extends Error>(err: E) {
        return this.errorR({
            data: (err as any).data || null,
            error: err
        })
    }
    asErrorN<E extends Error>(err: E) {
        return this.errorN({
            data: (err as any).data || null,
            error: err
        })
    }
}