import { Effect, Schema } from "effect";
import * as fs from "fs/promises";
import * as path from "path";
import { Middleware } from "../../../../messaging/base/middleware";
import { Log, recieveMessageLogs } from "../../../../messaging/middleware/logging";

export function kernelDebugLogging(logFile: string = path.join(
    process.cwd(), "logs.log")
): Middleware {
    console.log("Logging to: " + logFile);

    let logFileCreated = false;
    const createLogFile = Effect.async<void, Error>(resume => {
        fs.writeFile(logFile, "").then(() => {
            logFileCreated = true;
            resume(Effect.succeed(void 0));
        }).catch((e: Error) => {
            resume(Effect.fail(e));
        });
    })

    return recieveMessageLogs(
        Effect.fn("log_to_file")(
            function* (message: Log) {
                if (!logFileCreated) {
                    yield* createLogFile;
                }

                // console.log("MESSAGE", message);
                const jsonMessage = yield* Schema.encode(Schema.parseJson(Schema.Any))(message);
                const logContent = jsonMessage + "\n";
                yield* Effect.tryPromise({
                    try: () => fs.appendFile(logFile, logContent),
                    catch: (error) => new Error(`Failed to append to log file: ${error}`)
                });
            },
            (e) => e.pipe(
                Effect.tapError(e => Effect.logError(e)),
                Effect.ignore
            )
        )
    )
}