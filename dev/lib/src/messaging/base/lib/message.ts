import { Address } from "../address";
import { Message } from "../message";
import { Schema, ParseResult, pipe, Effect } from "effect";

import { LocalMessageData } from "../message";
import { deserializeAddressFromUnknown } from "./address";

const StringAnySchema = Schema.Record({
    key: Schema.String,
    value: Schema.Any
})

export function JustRecievedLocalData(): LocalMessageData {
    return {
        at_target: false,
        at_source: false,
        current_address: Address.local_address,
        direction: "incoming"
    }
}

export const MessageFromString = Schema.transformOrFail(Schema.String, Schema.instanceOf(Message), {
    decode: (str: string, _, ast) =>
        pipe(
            Effect.try(() => JSON.parse(str)),
            Effect.catchAll(e => {
                return ParseResult.fail(
                    new ParseResult.Type(ast, str, `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`)
                );
            }),
            Effect.andThen((json) => Effect.gen(function* () {
                const content = yield* Schema.decode(StringAnySchema)(json.content);
                const meta_data = yield* Schema.decode(StringAnySchema)(json.meta_data);
                const target = yield* deserializeAddressFromUnknown(json.target);
                return new Message(target, content, meta_data)
            })),
            Effect.catchAll(e => {
                return ParseResult.fail(
                    new ParseResult.Type(ast, str, `Failed deserializing message: ${e instanceof Error ? e.message : String(e)}`));
            })
        ),
    encode: (msg: Message, _, ast) =>
        Effect.try(() => JSON.stringify({
            target: msg.target.serialize(),
            content: msg.content,
            meta_data: msg.meta_data
        })).pipe(
            Effect.catchAll(e => {
                return ParseResult.fail(
                    new ParseResult.Type(ast, msg, `Failed to stringify message: ${e instanceof Error ? e.message : String(e)}`)
                );
            }),
        )
});