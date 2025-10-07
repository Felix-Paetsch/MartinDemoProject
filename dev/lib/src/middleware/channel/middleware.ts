import { Message, Middleware, Port, Failure } from "../../messaging/exports";
import { Schema } from "effect";
import MessageChannel from ".";
import { ChannelTransmitionData, InternalChannelMessage } from "./schemas/messages";

export function isMessageChannelMessage(m: Message): boolean {
    return (typeof m.meta_data["message_channel_middleware"] == "string") && m.local_data.at_target;
}

export const processMessageChannelMessage: Middleware.Middleware = (m: Message) => {
    if (!isMessageChannelMessage(m)) {
        return Middleware.Continue;
    }

    let body: { messages: InternalChannelMessage[] };
    try {
        body = Schema.decodeUnknownSync(ChannelTransmitionData)(m.content);
    } catch (e) {
        throw new Error("Message channel message has wrong format.");
    }

    const port = Port.open_ports.find(p => p.address.equals(m.target));
    if (!port) {
        return Failure.reportAnomaly(new Error("Port for message channel message not found."));
    }
    processMessageBody(body.messages, port);
    return Middleware.Interrupt;
}

export const processMessageBody = async (body: InternalChannelMessage[], port: Port) => {
    for (const channelMsg of body) {
        if (channelMsg.type === "OpenNewChannel") {
            const processor = MessageChannel.get_processor(channelMsg.context.target_processor);
            if (!processor) {
                Failure.reportAnomaly(new Error("Processor for message channel message not found."));
                continue;
            }
            const channel = new MessageChannel(
                channelMsg.address,
                port,
                [],
                channelMsg.context,
                channelMsg.config
            );
            processor(channel);
            continue;
        }

        const channel = MessageChannel.open_channels.find(c => {
            return (c.context.id === channelMsg.targetID) && c.port === port
        });

        if (!channel) {
            Failure.reportAnomaly(new Error("Channel for message channel message not found."));
            continue;
        }

        if (channelMsg.type === "CloseChannel") {
            channel.__closed_remotely();
            continue;
        }

        if (channelMsg.type === "SendMessage") {
            channel.__on_message(channelMsg.data);
            continue;
        }
    }
}
