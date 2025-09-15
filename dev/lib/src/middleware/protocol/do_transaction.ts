import { Schema } from "effect";
import { Failure, Address, Port, Json } from "../../messaging/exports";
import MessageChannel, { MessageChannelProcessor } from "../channel";
import { Protocol, ProtocolError, ProtocolMap } from ".";

const TransactionInitDataSchema = Schema.Struct({
    ident: Schema.Any,
    name: Schema.String,
});

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
        const responder = protocol.findResponder(ident, mc);
        if (responder) {
            await mc.send("ok");
            return await protocol.respond(mc, responder);
        }
    }

    Failure.reportAnomaly(new Error("Didn't find responder for protocol: " + name));
}

MessageChannel.register_processor("protocol_processor", protocolProcessor);

export async function executeProtocol<
    Initiator,
    Responder extends NonNullable<unknown>,
    Result,
    InitData,
    ResponderIdentifier extends Json
>(
    protocol: Protocol<Initiator, Responder, Result, InitData, ResponderIdentifier>,
    initiator: Initiator,
    target: Address,
    port: Port,
    responderIdentifier: ResponderIdentifier,
    initData: InitData
): Promise<Result | ProtocolError> {
    console.log("Start Executing", protocol.name)
    const mc = new MessageChannel(
        target,
        port,
        { target_processor: "protocol_processor" },
        { defaultMessageTimeout: 2000 }
    );

    if (!mc.is_open()) {
        return new Error("Port is closed");
    }

    const res = await mc.send_await_response(
        Schema.encodeSync(TransactionInitDataSchema)({
            ident: responderIdentifier,
            name: protocol.name,
        }));
    if (res !== "ok") return new Error("Failed to find responder");
    return protocol.initiate(mc, initiator, initData).then(r => {
        console.log("End Executing", protocol.name)
        return r;
    });
}