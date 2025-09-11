import { LogEntry } from "./logEntry";

export type Formatter = (log: LogEntry) => string;

export const DefaultFormatter: Formatter = (log: LogEntry) => {
    return log.to_string();
}
