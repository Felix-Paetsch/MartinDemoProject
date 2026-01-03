import * as M from "../../../src/messaging/exports";

const Places = ["A", "B", "C"] as const;

const Rec: Record<(typeof Places)[number], (m: M.Message) => void | Promise<void>> = {} as any;
const Por: Record<(typeof Places)[number], M.Port> = {} as any;

for (const p of Places) {
    Rec[p] = (m) => {
        console.log("Port", p, "recieved:", m.content.msg)
    }

    Por[p] = new M.Port(
        p,
        (m) => Rec[p](m)
    );
    Por[p].open();
}

function send(p: (typeof Places)[number], m: string) {
    const msg = new M.Message(
        new M.LocalAddress(p),
        {
            msg: m
        }
    );

    Por[p].send(msg);
}

send("A", "HI");
