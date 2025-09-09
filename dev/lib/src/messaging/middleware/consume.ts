import { Effect } from "effect";
import { Middleware } from "../base/middleware";
import { LocalComputedMessageData } from "../exports";
import { Message } from "../base/message";
import { MiddlewareInterrupt } from "../base/middleware";
import { promisify } from "../../utils/promisify";

export const comsume_message = (fn: (msg: Message) => void | Promise<void>): Middleware => Effect.fn("Consume message")(
        function* (message: Message, lcmd: LocalComputedMessageData) {
                yield* Effect.promise(() => promisify(fn(message)));
                return MiddlewareInterrupt;
        }) 

