// TODO: (Maybe)
// Try to remove effect as much as possible? Maybe not even? Still a good test case.


import * as M from "../../../src/messaging/exports";
import MessageChannel from "../../../src/middleware/channel/index";

const Places = ["A", "B", "C", "D"] as const;
const channels: MessageChannel[] = [];

function channel(from: typeof Places[number], to: typeof Places[number]) {
    return channels.find(c => (
        c.port.id === from
        && c.partner.port === to
    ))!
}

const Por: Record<(typeof Places)[number], M.Port> = {} as any;
for (const p of Places) {
    const port = new M.Port(p);
    Por[p] = port;
    port.open();
    port.use_middleware(MessageChannel.middleware)
}

for (let i = 0; i < Places.length; i++) {
    for (let j = i + 1; j < Places.length; j++) {
        channels.push(...MessageChannel.localChannels(
            Por[Places[i]!]!, Por[Places[j]!]!
        ));
    }
}

const messageDirections = [
    true,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
    true
]

const log = false;
async function dispatchA(ch: MessageChannel) {
    for (let i = 0; i < messageDirections.length; i++) {
        log && console.log(i, "Dispatch A start")

        if (messageDirections[i]) {
            await ch.next();
            log && console.log("Dispatch A, recieved");
        } else {
            ch.send(messageDirections[i]!);
            log && console.log("Dispatch B, send");
        }

        log && console.log(i, "Dispatch A end")
    }
}

async function dispatchB(ch: MessageChannel) {
    for (let i = 0; i < messageDirections.length; i++) {
        log && console.log(i, "Dispatch A start")

        if (!messageDirections[i]) {
            await ch.next();
            log && console.log("Dispatch A, recieved");
        } else {
            ch.send(messageDirections[i]!);
            log && console.log("Dispatch B, send");
        }

        log && console.log(i, "Dispatch A end")
    }
}

const prom = [
    dispatchA(channel("A", "B")),
    dispatchB(channel("B", "A")),

    dispatchA(channel("C", "D")),
    dispatchB(channel("D", "C")),
]

await Promise.all(prom);
console.log("== DONE! ==")

// channel("A", "B").send("Hello");
// const res = await channel("B", "A").next()
// console.log(res);
