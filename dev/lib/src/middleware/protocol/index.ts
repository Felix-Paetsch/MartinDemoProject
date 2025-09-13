import { Json } from "../../utils/json";
import MessageChannel from "../channel";

export type Protocol<Initiator = NoActor, Responder extends NonNullable<unknown> = NoActor, Result = void, InitData = null> = {
    name: string;
    initiate: (mc: MessageChannel, initiator: Initiator, with_data: InitData) => Promise<Result>;
    respond: (mc: MessageChannel, responder: Responder) => Promise<void>;

    findResponder: (identData: Json, mc: MessageChannel) => null | Responder;
}

export const NoActor = Symbol("NoActor");
export type NoActor = typeof NoActor;
export const ProtocolMap: Map<string, Protocol<any, any, any, any>[]> = new Map();
export type ProtocolError = Error;
export function NoResponder(): NoActor { return NoActor; }

export function registerProtocol(protocol: Protocol<any, any, any>) {
    if (!ProtocolMap.has(protocol.name)) {
        ProtocolMap.set(protocol.name, []);
    }
    ProtocolMap.get(protocol.name)!.push(protocol);
}

export { executeProtocol } from "./do_transaction";