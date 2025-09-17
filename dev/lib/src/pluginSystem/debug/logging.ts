import * as fs from "fs/promises";
import * as path from "path";
import { Logging, Failure } from "../../messaging/exports";

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
        await fs.appendFile(logFile, JSON.stringify(log) + "\n").catch(() => { });
    };

    Logging.process_middleware_logs_using(logMessage);
}

export async function init_external_logging() {
    Logging.set_logging_target("http://localhost:4000/");
    await fetch("http://localhost:4000/clear", {
        method: "POST",
    });
}
