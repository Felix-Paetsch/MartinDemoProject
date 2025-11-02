import { Log } from "../log";

export type Formatter = (log: Log) => string;

export const DefaultFormatter: Formatter = (log: Log) => {
    return JSON.stringify(log, null, 2);
}
