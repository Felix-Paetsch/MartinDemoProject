import { Json, Port } from "../../lib/src/messaging/exports";
import MessageChannel from "../../lib/src/middleware/channel";
import { Failure } from "../../lib/src/messaging/exports";
import chalk from "chalk";
import { executeProtocol, NoActor, NoResponder, Protocol, registerProtocol } from "../../lib/src/middleware/protocol";

Failure.setAnomalyHandler((e) => {
    throw e;
});
Failure.setErrorHandler((e) => {
    throw e;
});

const WhoToWho: boolean[] = [
    true,
    false,
    false,
    false,
    true,
    true,
    false,
    true,
    false
];

const ping: Protocol<NoActor, NoActor, string, null> = {
    name: "ping",
    initiate: async (mc: MessageChannel, initiator: NoActor) => {
        return await mc.send_await_response("ping") as string;
    },
    respond: async (mc: MessageChannel, responder: NoActor) => {
        const res = await mc.next();
        mc.send(res as string);
    },
    findResponder: NoResponder
};

const p1 = new Port("Test1").open();
const p2 = new Port("Test2").open();

p1.use_middleware(MessageChannel.middleware);
p2.use_middleware(MessageChannel.middleware);

registerProtocol(ping);

executeProtocol(
    ping,
    NoActor,
    p2.address,
    p1,
    null,
    null
).then(r => {
    console.log(r);
});