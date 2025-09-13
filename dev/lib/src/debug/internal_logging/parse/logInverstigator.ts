import { Effect, flow, pipe } from "effect";
import path from "path";
import { Log, recieveMessageLogs } from "../../../middleware/logging";
import { LogCollection } from "./logCollection";
import { DataLogEntry, LogEntry, MessageLogEntry } from "./logEntry";

export default class LogInvestigator extends LogCollection {
    constructor(logs: LogEntry[] = []) {
        super(null as any, logs.map(log => {
            if (log.type === "Message") {
                return new MessageLogEntry(null as any, log);
            } else {
                return new DataLogEntry(null as any, log);
            }
        }));
        (this as any).investigator = this;
        this.logs.forEach(log => (log as any).log_investigator = this);
    }

    listen() {
        return recieveMessageLogs(
            flow(
                Effect.fn("recieveMessageLogs")(function* (
                    this: LogInvestigator, message: Log
                ) {
                    if (message.type === "Message") {
                        this.push(new MessageLogEntry(this, message));
                    } else {
                        this.push(new DataLogEntry(this, message));
                    }
                }).bind(this),
                Effect.runPromise
            )
        )
    }

    static async fromFile(FilePath: string = path.join(
        process.cwd(), "logs.log")
    ): Promise<LogInvestigator> {
        const fs = await import("fs");
        const path = await import("path");
        const totalFilePath = path.join(FilePath);
        const logs: string = fs.readFileSync(totalFilePath, "utf8");
        const logLines = logs.split("\n");
        const logMessages = [];
        for (const line of logLines) {
            try {
                const logMessage = JSON.parse(line);
                logMessages.push(logMessage);
            } catch (e) { }
        }
        return new LogInvestigator(logMessages);
    }
}

