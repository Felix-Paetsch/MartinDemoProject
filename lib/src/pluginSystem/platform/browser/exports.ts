import { BrowserKernelEnvironment } from "./kernel";
import { compute_api_data as CAPID } from "./enpoints/index";
import { execute_plugin } from "./iframe/connect";
import * as CanvasStuff from "./canvas/index";

export namespace BrowserPlatform {
    export const compute_api_data = CAPID
    export const KernelEnvironment = BrowserKernelEnvironment

    export const start_iframe_plugin = execute_plugin

    export const Canvas = CanvasStuff.Canvas
    export const on_canvas_request = CanvasStuff.on_canvas_request
    export const request_canvas = CanvasStuff.request_canvas
}
