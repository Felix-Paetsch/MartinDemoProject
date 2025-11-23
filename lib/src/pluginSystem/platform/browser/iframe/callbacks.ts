import { PluginReference } from "../../../kernel_exports";

export type OnIframePluginCallback = (iframe: HTMLIFrameElement, p: PluginReference) => void | Promise<void>;

export const IframeCallbacks: {
    on_iframe_plugin: OnIframePluginCallback;
} = {
    on_iframe_plugin: () => { },
};

type CallbacksMap = typeof IframeCallbacks;
type CallbackRegister<T extends Record<string, (...a: any[]) => any>> = {
    [K in keyof T]: (cb: T[K]) => void;
};

export const IframeCallbackMap: CallbackRegister<CallbacksMap> = Object.keys(
    IframeCallbacks
).reduce((acc, key) => {
    (acc as any)[
        // `register_${key.replace(/^on_/, '')}`
        key
    ] = (cb: any) => {
        (IframeCallbacks as any)[key] = cb;
    };
    return acc;
}, {} as any);
