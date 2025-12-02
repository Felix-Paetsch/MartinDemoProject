import { LogCollection } from "./logCollection";
import { Log } from "../log";

export class LogInvestigator extends LogCollection {
    constructor(logs: Log[] = []) {
        super(null as any, logs);
        (this as any).investigator = this;
    }

    static async fromFile(FilePath: string): Promise<LogInvestigator> {
        const fs = await import("fs");
        const logs: string = fs.readFileSync(FilePath, "utf8");
        const logLines = logs.split("\n").filter(l => l.trim() !== "");
        const logMessages = [];
        for (const line of logLines) {
            try {
                const logMessage = JSON.parse(line);
                logMessages.push(logMessage);
            } catch (e) {
                console.log(e);
            }
        }
        return new LogInvestigator(logMessages);
    }

    collect_logs() {
        return ((log: Log): void => {
            this.logs.push(log);
        }).bind(this);
    }
    private static global_instance: LogInvestigator | null = null;
    static GlobalInstance(): LogInvestigator {
        if (this.global_instance) return this.global_instance;
        this.global_instance = new LogInvestigator();
        (globalThis as any).GlobalLogInvestigator = this.global_instance;
        return this.global_instance;
    }
}

