declare const window: any;

function get_environment(): 'browser' | 'node' {
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        return 'browser' as const;
    }
    if (typeof process !== 'undefined' && process.versions?.node) {
        return 'node' as const;
    }

    throw new Error("Cant determine environment");
}

export default get_environment();
