
import { Message } from "../base/message";
import { isMiddlewareContinue, isMiddlewareInterrupt, Middleware, MiddlewareContinue, MiddlewareInterrupt } from "../base/middleware";

export function collection_middleware(arr: Middleware[]): Array<Middleware> & (() => Middleware);
export function collection_middleware(...arr: Middleware[]): Array<Middleware> & (() => Middleware);
export function collection_middleware(...args: any[]): Array<Middleware> & (() => Middleware) {
    const arr: Middleware[] = Array.isArray(args[0]) ? args[0] : args;

    const mwf = (): Middleware => {
        return async (message: Message) => {
            for (let a of arr) {
                const mp = await a(message);
                if (isMiddlewareInterrupt(mp)) {
                    return mp;
                }
            }
            return MiddlewareContinue;
        }
    }

    return new Proxy(mwf, {
        get(target, prop, receiver) {
            if (prop in arr) {
                const value = (arr as any)[prop];
                if (typeof value === 'function') {
                    return value.bind(arr);
                }
                return value;
            }
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
            if (prop in arr) {
                (arr as any)[prop] = value;
                return true;
            }
            return Reflect.set(target, prop, value, receiver);
        },
        has(target, prop) {
            return prop in arr || Reflect.has(target, prop);
        },
        ownKeys(target) {
            return [...Reflect.ownKeys(arr), ...Reflect.ownKeys(target)];
        },
        getOwnPropertyDescriptor(target, prop) {
            if (prop in arr) {
                return Reflect.getOwnPropertyDescriptor(arr, prop);
            }
            return Reflect.getOwnPropertyDescriptor(target, prop);
        }
    }) as Array<Middleware> & (() => Middleware);
}

export function non_interrupt_collection_middleware(arr: Middleware[]): Array<Middleware> & (() => Middleware);
export function non_interrupt_collection_middleware(...arr: Middleware[]): Array<Middleware> & (() => Middleware);
export function non_interrupt_collection_middleware(...args: any[]): Array<Middleware> & (() => Middleware) {
    const arr: Middleware[] = Array.isArray(args[0]) ? args[0] : args;

    const mwf = (): Middleware => {
        return async (message: Message) => {
            for (let a of arr) {
                const mp = await a(message);
                if (isMiddlewareInterrupt(mp)) {
                    return MiddlewareContinue;
                }
            }
            return MiddlewareContinue;
        }
    }

    return new Proxy(mwf, {
        get(target, prop, receiver) {
            if (prop in arr) {
                const value = (arr as any)[prop];
                if (typeof value === 'function') {
                    return value.bind(arr);
                }
                return value;
            }
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
            if (prop in arr) {
                (arr as any)[prop] = value;
                return true;
            }
            return Reflect.set(target, prop, value, receiver);
        },
        has(target, prop) {
            return prop in arr || Reflect.has(target, prop);
        },
        ownKeys(target) {
            return [...Reflect.ownKeys(arr), ...Reflect.ownKeys(target)];
        },
        getOwnPropertyDescriptor(target, prop) {
            if (prop in arr) {
                return Reflect.getOwnPropertyDescriptor(arr, prop);
            }
            return Reflect.getOwnPropertyDescriptor(target, prop);
        }
    }) as Array<Middleware> & (() => Middleware);
}