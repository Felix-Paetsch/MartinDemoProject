import { Message, Middleware, Port, Failure } from "../../messaging/exports";
import { Schema } from "effect";
import MessageChannel from ".";
import { MessageData, MessageDataSchema } from "./schemas";
import chalk from "chalk";

export function isMessageChannelMessage(m: Message): boolean {
    return (m.meta_data["message_channel_middleware"] === true) && m.local_data.at_target;
}

export const processMessageChannelMessage: Middleware.Middleware = (m: Message) => {
    if (!isMessageChannelMessage(m)) {
        return Middleware.Continue;
    }

    let body: MessageData;
    try {
        body = Schema.decodeUnknownSync(MessageDataSchema)(m.content);
    } catch (e) {
        throw new Error("Message channel message has wrong format.");
    }

    const port = Port.open_ports.find(p => p.address.equals(m.target));
    if (!port) {
        return Failure.reportAnomaly(new Error("Port for message channel message not found."));
    }
    processMessageBody(body, port);
    return Middleware.Interrupt;
}

export const processMessageBody = (body: MessageData, port: Port) => {
    if (body.type === "OpenNewChannel") {
        const processor = MessageChannel.get_processor(body.context.target_processor);
        if (!processor) {
            return Failure.reportAnomaly(new Error("Processor for message channel message not found."));
        }
        const channel = new MessageChannel(
            body.address,
            port,
            body.context,
            body.config
        );
        body.message && processMessageBody(body.message, port);
        return Promise.resolve(processor(channel));
    }
    const channel = MessageChannel.open_channels.find(c => {
        return (c.context.id === body.targetID) && c.port === port
    });
    if (!channel) {
        return Failure.reportAnomaly(new Error("Channel for message channel message not found."));
    }

    if (body.type === "CloseChannel") {
        return channel.__closed_remotely();
    }

    if (body.type === "SendMessage") {
        channel.__on_message(body.data);
    }
}