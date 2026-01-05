import { Schema } from "effect";
import { Failure } from "../../messaging/exports";
import MessageChannel, { MessageChannelProcessor } from "../channel";
import { TransactionInitDataSchema } from ".";

const ProtocolMap: Map<string, {
    findResponder: (identData: any, mc: MessageChannel) => null | any;
    respond: (mc: MessageChannel, responder: any, with_data: any) => Promise<void>;
}[]> = new Map();
export type ProtocolError = Error;

export function registerProtocol(
    name: string,
    pData: {
        findResponder: (identData: any, mc: MessageChannel) => null | any,
        respond: (mc: MessageChannel, responder: any, with_data: any) => Promise<void>,
    }
) {
    if (!ProtocolMap.has(name)) {
        ProtocolMap.set(name, []);
    }
    ProtocolMap.get(name)!.push(pData);
}

const protocolProcessor: MessageChannelProcessor = async (mc: MessageChannel) => {
    const msg = await mc.next();
    if (msg instanceof Error) {
        Failure.reportAnomaly(new Error("Invoked protocol processor without message"));
        return;
    }

    const r = Schema.decodeUnknownSync(TransactionInitDataSchema)(msg);
    const ident: any = r.ident;
    const name: string = r.name;
    const initData: any = r.initData;

    const protocols = ProtocolMap.get(name) || [];
    for (const protocol of protocols) {
        const responder = protocol.findResponder(ident, mc);
        if (responder) {
            return await protocol.respond(mc, responder, initData);
        }
    }

    Failure.reportAnomaly(new Error("Didn't find responder for protocol: " + name));
}

MessageChannel.register_processor("protocol_processor", protocolProcessor);
