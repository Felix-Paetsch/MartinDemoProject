import * as M from "../../../src/messaging/exports";
import MessageChannel from "../../../src/middleware/channel/index";

const Places = ["A", "B", "C"] as const;
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

channel("A", "B").send("Hello");
const res = await channel("B", "A").next()
console.log(res);
