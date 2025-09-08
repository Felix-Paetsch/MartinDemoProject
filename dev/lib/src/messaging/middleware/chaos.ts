import { Effect } from "effect";
import { Address } from "../base/address";
import { LocalComputedMessageData } from "../base/local_computed_message_data";
import { Message } from "../base/message";
import { Middleware, MiddlewareContinue, MiddlewareInterrupt } from "../base/middleware";

export function block_address(address: Address, m: BlockingMethod): Middleware {
    return Effect.fn("block_address")(
        function* (message: Message, lcmd: LocalComputedMessageData) {
            if (message.target !== address) {
                return MiddlewareContinue;
            }
            if (m(message, lcmd)) {
                return MiddlewareInterrupt;
            }
            return MiddlewareContinue;
        }
    )
}

export function block_all_communication(m: BlockingMethod): Middleware {
    return Effect.fn("block_all_communication")(
        function* (message: Message, lcmd: LocalComputedMessageData) {
            if (m(message, lcmd)) {
                return MiddlewareInterrupt;
            }
            return MiddlewareContinue;
        }
    )
}

type BlockingMethod = (message: Message, lcmd: LocalComputedMessageData) => boolean; // True means the message is blocked

export function with_probability(probability: number): BlockingMethod {
    return (message: Message, lcmd: LocalComputedMessageData) => Math.random() < probability;
}

export function for_time_periods(duration: number, expected_time_to_first_event_s: number): BlockingMethod {
    const rate = 1 / (expected_time_to_first_event_s * 1000);

    let currentBlockStart: number | null = null;
    let nextBlockStart: number | null = null;

    const calculateNextBlockStart = () => {
        const u = Math.random();
        const timeUntilNext = -Math.log(1 - u) / rate;
        return Date.now() + timeUntilNext;
    };

    nextBlockStart = calculateNextBlockStart();

    return () => {
        const now = Date.now();
        if (currentBlockStart !== null) {
            const timeInBlock = now - currentBlockStart;
            if (timeInBlock >= duration) {
                currentBlockStart = null;
                nextBlockStart = calculateNextBlockStart();
                return false;
            }
            return true;
        }

        if (nextBlockStart !== null && now >= nextBlockStart) {
            currentBlockStart = now;
            nextBlockStart = null;
            return true;
        }

        return false;
    };
}

export function after_delay(delay: number): BlockingMethod {
    const start_time = Date.now();
    return (message: Message) => {
        const time_passed = Date.now() - start_time;
        return time_passed > delay;
    }
}

export function fail_inizialization_with_probability(p: number): BlockingMethod {
    const failed = Math.random() < p;
    return () => failed;
}

export function after_probability(probability: number): BlockingMethod {
    return block_after_first_failure(with_probability(probability));
}

function block_after_first_failure(blocking_method: BlockingMethod): BlockingMethod {
    let failed = false;
    return (message: Message, lcmd: LocalComputedMessageData) => {
        if (failed) {
            return true;
        }
        return failed = blocking_method(message, lcmd);
    }
}