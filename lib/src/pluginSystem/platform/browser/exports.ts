import { BrowserKernelEnvironment } from "./kernel";
import { compute_api_data as CAPID } from "./api_endpoints";
import { execute_plugin } from "./iframe/connect";
import { IframeCallbackMap } from "./iframe/callbacks"

export namespace BrowserPlatform {
    export const compute_api_data = CAPID
    export const KernelEnvironment = BrowserKernelEnvironment
    export const start_iframe_plugin = execute_plugin
    export const on_iframe_plugin = IframeCallbackMap.on_iframe_plugin
}
