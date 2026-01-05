import * as M from "../../../src/messaging/exports";
import MessageChannel from "../../../src/middleware/channel/index";
import { NoResponder, protocol } from "../../../src/middleware/protocol/index";
import { AnythingTranscoder } from "../../../src/utils/transcoder";

const Places = ["A", "B"] as const;

const Por: Record<(typeof Places)[number], M.Port> = {} as any;
for (const p of Places) {
    const port = new M.Port(p);
    Por[p] = port;
    port.open();
    port.use_middleware(MessageChannel.middleware)
}

const prot = protocol(
    "testProtocol",
    () => NoResponder,
    async (mc: MessageChannel, init: null, with_data: null) => { },
    async (mc: MessageChannel, res: typeof NoResponder, with_data: string) => {
        console.log(with_data)
    }
)

prot(null, Por["A"], Por["B"].address, null, "Hello", null);
