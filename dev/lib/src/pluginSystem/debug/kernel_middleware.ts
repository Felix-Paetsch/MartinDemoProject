import * as fs from "fs/promises";
import * as path from "path";
import { Logging, Failure } from "../../../messaging/exports";

export function start_kernel_log_to_file(logFile: string = path.join(
    process.cwd(), "logs.log")
) {
    console.log("Logging to: " + logFile);

    const logFileCreated = new Promise<boolean>((res) => {
        fs.writeFile(logFile, "").then(() => {
            res(true);
        }).catch((e: Error) => {
            Failure.reportAnomaly(e);
            return res(false);
        });
    });

    const logMessage: Logging.LogProcessor = async (log: Logging.Log) => {
        if (!(await logFileCreated)) return;
        await fs.appendFile(logFile, JSON.stringify(log)).catch(() => { });
    };

    Logging.process_logs(logMessage);
}
