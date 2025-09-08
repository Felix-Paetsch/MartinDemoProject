import { DataLog, MessageLog } from "../../../../messaging/middleware/logging";
import LogInvestigator from "./logInverstigator";

export class DataLogEntry implements DataLog {
    readonly data!: DataLog["data"];
    readonly type = "Data";

    constructor(
        readonly log_investigator: LogInvestigator,
        readonly log: DataLog
    ) {
        Object.assign(this, log);
    }

    to_string(): string {
        return JSON.stringify(this.log, null, 2);
    }
}

export class MessageLogEntry implements MessageLog {
    readonly content!: MessageLog["content"];
    readonly meta_data!: MessageLog["meta_data"];
    readonly type = "Message";

    constructor(
        readonly log_investigator: LogInvestigator,
        readonly log: MessageLog
    ) {
        Object.assign(this, log);
    }

    message_chain() {
        return this.log_investigator.messages().message_chain(this.log);
    }

    to_string(): string {
        return JSON.stringify({
            type: this.type,
            content: this.content,
            meta_data: this.meta_data
        }, null, 2);
    }
}

export type LogEntry = DataLogEntry | MessageLogEntry;