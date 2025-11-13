import { BrowserKernelEnvironment } from "./kernel";
import { compute_api_data as CAPID } from "./api_endpoints";
import { execute_plugin } from "./iframe/connect";

export namespace BrowserPlatform {
    export const compute_api_data = CAPID
    export const KernelEnvironment = BrowserKernelEnvironment
    export const start_iframe_plugin = execute_plugin
}
