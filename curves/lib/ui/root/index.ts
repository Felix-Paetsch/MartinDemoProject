import { UIWindow } from "../methods/local";

export const _LocalCallbackMap = {
    on_window: (w: UIWindow): void | Promise<void> => { },
} as const;

export const LocalCallbackMap = _LocalCallbackMap as {
    -readonly [K in keyof typeof _LocalCallbackMap]: typeof _LocalCallbackMap[K];
};

type SetterRecord<T extends Record<string, (...args: any[]) => any>> = {
    [K in keyof T]: (cb: T[K]) => void;
};

export const SetLocalCallbacks: SetterRecord<typeof LocalCallbackMap> = Object.fromEntries(
    Object.entries(LocalCallbackMap).map(([key]) => [
        key,
        ((cb: any) => {
            (LocalCallbackMap as any)[key] = cb;
        }) as (cb: any) => void,
    ])
) as SetterRecord<typeof LocalCallbackMap>;
