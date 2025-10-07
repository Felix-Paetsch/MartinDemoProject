import { Logging } from "../../dev/lib/src/messaging/exports";

Logging.LogInvestigator.fromFile("debug/logs/internal_logs.log").then(
    l => {
        const msg = l.messages().at_sender();
        const map = msg.group_by(l => l.meta_data["message_channel_middleware"]);
        for (const key of map.keys()) {
            console.log("========================");
            console.log(map.get(key)?.logs[1]);
        }
    }
);
