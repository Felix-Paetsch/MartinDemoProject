import { Protocol, registerProtocol } from "../../../middleware/protocol";
import { LibraryIdent } from "../../library/library_environment";
import LibraryMessagePartner from "../../plugin_lib/message_partner/library";
import { LibraryEnvironment } from "../../library/library_environment";
import { Json } from "../../../utils/json";
import { Effect, Schema } from "effect";
import { failOnError } from "../../../messagingEffect/utils";
import MessageChannel from "../../../middleware/channel";
import { findLibrary } from "../findResponder";

const callSchema = Schema.Struct({
    fn: Schema.String,
    args: Schema.Array(Schema.Any)
})

export const call_protocol: Protocol<
    LibraryMessagePartner,
    LibraryEnvironment,
    Json | Error,
    { fn: string, args: Json[] },
    LibraryIdent
> = {
    name: "call_library_method",
    initiate: async (mc: MessageChannel, initiator: LibraryMessagePartner, { fn, args }: { fn: string, args: Json[] }) => {
        return Effect.gen(function* () {
            const argsSend = yield* Schema.encode(callSchema)({
                args,
                fn
            });
            yield* Effect.promise(() => mc.send(argsSend as any)).pipe(failOnError);
            return yield* Effect.promise(() => mc.next()).pipe(failOnError);
        }).pipe(
            Effect.merge,
            Effect.runPromise
        )
    },
    respond: async (mc: MessageChannel, responder: LibraryEnvironment) => {
        await Effect.gen(function* () {
            const data = yield* Effect.promise(() => mc.next()).pipe(failOnError);
            const { fn, args } = yield* Schema.decodeUnknown(callSchema)(data);
            const res = yield* Effect.tryPromise({
                try: () => Promise.resolve(responder.implementation.call(fn, args)),
                catch: (e) => new Error(String(e))
            });
            yield* Effect.promise(() => mc.send(res as any)).pipe(failOnError);
        }).pipe(
            Effect.merge,
            Effect.runPromise
        )
    },
    findResponder: findLibrary
}

registerProtocol(call_protocol);