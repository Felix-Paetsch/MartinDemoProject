export const Severity = {
    "DEBUG": 0,
    "INFO": 1,
    "WARNING": 2,
    "ERROR": 3,
    "CRITICAL": 4
} as const;

export type Severity = typeof Severity[keyof typeof Severity];