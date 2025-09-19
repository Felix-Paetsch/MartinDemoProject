export function deferredFn<Args extends any[], Result extends any>(
    a: () => (...args: Args) => Result
): (...args: Args) => Result {
    let res: ((...args: Args) => Result) | null = null;
    let computed = false;
    return (...args) => {
        if (computed) return res!(...args);
        res = a();
        computed = true;
        return res(...args);
    }
}

export function deferedObj<S extends Record<string, any>>(
    factory: () => S
): S {
    let target: S | null = null;

    const getTarget = (): S => {
        if (target === null) {
            target = factory();
        }
        return target;
    };

    const handler: ProxyHandler<S> = {
        get(_obj, prop, receiver) {
            const real = getTarget();
            return Reflect.get(real, prop, receiver);
        },
        set(_obj, prop, value, receiver) {
            const real = getTarget();
            return Reflect.set(real, prop, value, receiver);
        },
        has(_obj, prop) {
            return prop in getTarget();
        },
        ownKeys(_obj) {
            return Reflect.ownKeys(getTarget());
        },
        getOwnPropertyDescriptor(_obj, prop) {
            return Object.getOwnPropertyDescriptor(getTarget(), prop);
        },
    };

    return new Proxy({} as S, handler);
}

export function deferred<Args extends any[], Result>(
    factory: () => (...args: Args) => Result
): (...args: Args) => Result;

export function deferred<S extends Record<string, any>>(
    factory: () => S
): S;

export function deferred(factory: () => any): any {
    let target: any = null;

    const getTarget = (): any => {
        if (target === null) {
            target = factory();
        }
        return target;
    };

    const handler: ProxyHandler<any> = {
        get(_obj, prop, receiver) {
            return Reflect.get(getTarget(), prop, receiver);
        },
        set(_obj, prop, value, receiver) {
            return Reflect.set(getTarget(), prop, value, receiver);
        },
        has(_obj, prop) {
            return prop in getTarget();
        },
        ownKeys(_obj) {
            return Reflect.ownKeys(getTarget());
        },
        getOwnPropertyDescriptor(_obj, prop) {
            return Object.getOwnPropertyDescriptor(getTarget(), prop);
        },
        apply(_target, thisArg, argArray) {
            return Reflect.apply(getTarget(), thisArg, argArray);
        },
    };

    // Trick: create proxy of a dummy function so we can support "apply"
    const dummyFn = function () { };
    return new Proxy(dummyFn as any, handler);
}
