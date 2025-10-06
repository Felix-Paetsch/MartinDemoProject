export type MakeMutable<T> = T extends (...args: any) => any
    ? T // don't modify functions
    : T extends readonly (infer U)[]
    ? MakeMutableArray<U> // handle arrays separately
    : T extends object
    ? { -readonly [K in keyof T]: MakeMutable<T[K]> }
    : T;

interface MakeMutableArray<T> extends Array<MakeMutable<T>> { }

export type MakeImmutable<T> = T extends (...args: any[]) => any
    ? T // functions stay callable
    : T extends (infer U)[]
    ? ReadonlyArray<MakeImmutable<U>> // arrays -> readonly arrays, recursively deep-freeze elements
    : T extends object
    ? { readonly [K in keyof T]: MakeImmutable<T[K]> }
    : T;

export function asImmutable<T>(r: T) {
    return r as MakeImmutable<T>;
}

export function asMutable<T>(r: T) {
    return r as MakeMutable<T>;
}
