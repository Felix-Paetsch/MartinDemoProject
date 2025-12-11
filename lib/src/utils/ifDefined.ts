const defaultIfDefined = true;
const ifDefinedMap = new Map<null | string, boolean>();

export function setIfDefined(what: null | string = null, toWhat: boolean = true) {
    ifDefinedMap.set(what, toWhat);
}

export function ifDefined<R>(fun: () => R): R | null;
export function ifDefined<R>(key: string, fun: () => R): R | null;
export function ifDefined<R>(
    arg1: string | (() => R),
    arg2?: () => R
): R | null {
    let enabled: boolean;

    if (typeof arg1 === "string") {
        const key = arg1;
        const fun = arg2!;
        enabled = ifDefinedMap.has(key)
            ? ifDefinedMap.get(key)!
            : defaultIfDefined;
        return enabled ? fun() : null;
    } else {
        const fun = arg1;
        enabled = ifDefinedMap.has(null)
            ? ifDefinedMap.get(null)!
            : defaultIfDefined;
        return enabled ? fun() : null;
    }
}
