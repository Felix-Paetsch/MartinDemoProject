import 'dotenv/config';
import { Effect } from "effect";
import { Middleware } from "../../messaging/core/middleware";
import { empty_middleware } from "../../messaging/middlewares/empty";
import { log_external as log, log_messages, log_to_url } from '../../advanced_messaging/logging';
import { Json } from "../../utils/json";

const DEBUG = process.env.DEBUG_MODE === "true"
let default_logging_target = process.env.Exfiltrate_API || "";

export const set_logging_url = (logging_url: string) => {
    default_logging_target = logging_url;
}

export const log_external_mw = (logging_url?: string): Middleware => {
    if (!DEBUG) return empty_middleware;
    const get_logging_url = logging_url || default_logging_target;

    return log_messages(log_to_url(get_logging_url));
}

export function clear_external_logs(logging_url?: string) {
    if (!DEBUG) return Promise.resolve();
    const get_logging_url = logging_url || default_logging_target;
    const clear_logs = Effect.tryPromise({
        try: () => fetch(`${get_logging_url}/clear`, {
            method: 'POST'
        }),
        catch: (error) => new Error(`Failed to clear external logs: ${error}`)
    })
    return Effect.runPromise(clear_logs.pipe(Effect.ignore));
}

export function log_external(data: Json, url?: string) {
    if (!DEBUG) return;
    log(
        url || default_logging_target,
        data
    ).pipe(
        Effect.ignore,
        Effect.runPromise
    )
}