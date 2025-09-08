const disposable = [
    "Library",
    "Plugin",
    "MessagePartner",
    "Custom"
] as const;

export type LifecycleEvent = "create_clean_up" | "trigger_clean_up" | "call_clean_up" | "clean_up_step"
export type Disposable = typeof disposable[number];