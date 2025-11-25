export type MakeMutable<T> = T extends (...args: any) => any
    ? T // don't modify functions
    : T extends readonly (infer U)[]
    ? MakeMutable<U>[] // handle arrays directly
    : T extends object
    ? { -readonly [K in keyof T]: MakeMutable<T[K]> }
    : T;

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

