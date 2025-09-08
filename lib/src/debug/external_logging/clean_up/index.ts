import { Json } from "../../../utils/json"
import { log_external } from "../log_external"
import { Disposable, LifecycleEvent } from "./types"

export function log_lifecycle_event(
    what: Disposable,
    metadata: { [key: string]: Json },
    event: LifecycleEvent
) {
    log_external({
        type: "LifecycleEvent",
        what,
        metadata: {
            stack: new Error().stack
                ?.split("\n")
                .slice(2)
                .join("\n") || "",
            ...metadata
        },
        event
    })
}

export const cleanup = {
    create: function log_create_clean_up(what: Disposable, metadata: { [key: string]: Json }) {
        log_lifecycle_event(what, metadata, "create_clean_up")
    },
    trigger: function log_trigger_clean_up(what: Disposable, metadata: { [key: string]: Json }) {
        log_lifecycle_event(what, metadata, "trigger_clean_up")
    },
    call: function log_call_clean_up(what: Disposable, metadata: { [key: string]: Json }) {
        log_lifecycle_event(what, metadata, "call_clean_up")
    },
    step: function log_step_clean_up(what: Disposable, step: string, metadata: { [key: string]: Json }) {
        log_lifecycle_event(what, {
            step,
            ...metadata
        }, "clean_up_step")
    },
}