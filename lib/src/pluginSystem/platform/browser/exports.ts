import { BrowserKernelEnvironment } from "./kernel";
import { compute_api_data as CAPID } from "./api_endpoints";

export namespace BrowserPlatform {
    export const compute_api_data = CAPID
    export const KernelEnvironment = BrowserKernelEnvironment
}
