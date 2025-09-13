import { Json } from "../../../utils/json";

export type PrimitiveMessageChannel = {
    send: (data: Json) => void;
    recieve: (cb: (data: Json) => void) => void;
}

export class Synchronizer {
    private triggerMap: Map<string, (data: Json) => void | Promise<void>> = new Map();

    private otherSideExists: Promise<void>;
    private otherSideExistsHelperBool: boolean = false;
    private resolveOtherSideExists: (() => void) = () => {
        this.otherSideExistsHelperBool = true;
    };

    constructor(private channel: PrimitiveMessageChannel) {
        this.channel.recieve(this.#recieve as any);
        this.otherSideExists = new Promise((resolve) => {
            if (this.otherSideExistsHelperBool === true) resolve();
            this.resolveOtherSideExists = () => {
                this.otherSideExistsHelperBool = true;
                resolve();
            };
        });
    }

    add_command(name: string, method: (data: Json) => void | Promise<void>) {
        this.triggerMap.set(name, method);
    }

    #ping() { this.channel.send({ type: "ping" }); }
    #on_ping() {
        this.channel.send({ type: "pong" });
        this.resolveOtherSideExists();
    }
    #on_pong() { this.resolveOtherSideExists(); }

    async sync() {
        this.#ping();
        return await this.otherSideExists;
    }

    async call_command(name: string, args: Json = null) {
        this.channel.send({
            type: "call",
            data: { name, args }
        });
        return await this.otherSideExists;
    }

    async #call(name: string, args: Json = null) {
        await this.otherSideExists;
        return this.triggerMap.get(name)?.(args);
    }

    #recieve(data: {
        type: string;
        data: Json
    }) {
        const type = data.type;
        if (type === "ping") {
            return this.#on_ping();
        } else if (type === "pong") {
            return this.#on_pong();
        } else if (type === "call") {
            return this.#call((data.data as any)?.name, (data.data as any)?.args!);
        }
    }
}