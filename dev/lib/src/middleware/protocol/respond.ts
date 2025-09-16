import { Schema } from "effect";
import { Failure, Address, Port, Json } from "../../messaging/exports";
import MessageChannel, { MessageChannelProcessor } from "../channel";
import { TransactionInitDataSchema, Transcoder } from ".";

const ProtocolMap: Map<string, {
    responderIdent: Transcoder<any, any>;
    findResponder: (identData: unknown, mc: MessageChannel) => null | any;
    respond: (mc: MessageChannel, responder: any) => Promise<void>;
}[]> = new Map();
export type ProtocolError = Error;

export function registerProtocol(name: string, pData: {
    responderIdent: Transcoder<any, any>;
    findResponder: (identData: any, mc: MessageChannel) => null | any;
    respond: (mc: MessageChannel, responder: any) => Promise<void>;
}) {
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

    let ident: Json;
    let name: string;
    try {
        const r = Schema.decodeUnknownSync(TransactionInitDataSchema)(msg);
        ident = r.ident;
        name = r.name;
    } catch (e) {
        Failure.reportAnomaly(new Error("Invoked protocol processor with invalid message"));
        return;
    }

    const protocols = ProtocolMap.get(name) || [];
    for (const protocol of protocols) {
        const decodedIdent = await protocol.responderIdent.decode(ident);
        if (decodedIdent instanceof Error) {
            continue;
        }
        const responder = protocol.findResponder(decodedIdent, mc);
        if (responder) {
            await mc.send("ok");
            return await protocol.respond(mc, responder);
        }
    }

    console.log(protocols, name);
    Failure.reportAnomaly(new Error("Didn't find responder for protocol: " + name));
}

MessageChannel.register_processor("protocol_processor", protocolProcessor);
