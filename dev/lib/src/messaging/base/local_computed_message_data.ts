import { Context } from "effect";
import { Address } from "./address";

/** 
 * Represents locally computed data about a message's state and routing
 */
export type LocalComputedMessageData = {
    /** 
     * The direction of message flow relative to the kernel
     * - "incoming": path to Kernel or at kernel for kernel-targeted messages
     * - "outgoing": path from kernel
     */
    direction: "incoming" | "outgoing" | "local";
    /** 
     * Whether the current address processor is the final target of the message.
     * If not overwritten by middleware, this is true only at the kernel if the message is for the kernel
     */
    at_target: boolean;
    /**
     * Whether the current address processor is the source of the message.
     */
    at_source: boolean;
    current_address: Address;

    [key: string]: any;
}

export class LocalComputedMessageDataT extends Context.Tag("LocalComputedMessageDataT")<
    LocalComputedMessageDataT,
    LocalComputedMessageData
>() { }

export const RecieveLocalComputedMessageData = (): LocalComputedMessageData => ({
    at_target: false,
    at_source: false,
    current_address: Address.local_address,
    direction: "incoming"
});