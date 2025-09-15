import { LogCollection } from "./logCollection";
import { Log } from "../log";

export default class LogInvestigator extends LogCollection {
    constructor(logs: Log[] = []) {
        super(null as any, logs);
        (this as any).investigator = this;
        this.logs.forEach(log => (log as any).log_investigator = this);
    }

    static async fromFile(FilePath: string): Promise<LogInvestigator> {
        const fs = await import("fs");
        const logs: string = fs.readFileSync(FilePath, "utf8");
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

