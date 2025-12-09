import { Logging } from "pc-messaging-kernel/messaging";

const seenMessageIds: string[] = [];
export function process_log(log: Logging.Log) {
    if (log.type === "Message") {
        const msg_id: string = log.meta_data.annotation.message_id;
        if (seenMessageIds.includes(msg_id)) return;
        seenMessageIds.push(msg_id);

        console.log(
            JSON.stringify(log, null, 2)
        );
    } else {
        console.log(log);
        throw new Error("bla");
    }
}
