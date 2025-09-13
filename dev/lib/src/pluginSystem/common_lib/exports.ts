import { initializeExternalPlugin_KernelSide } from "./initialization/kernelSide";
import { initializeExternalPlugin_PluginSide } from "./initialization/pluginSide";
import { PrimitiveMessageChannel as PrimitiveMessageChannelType } from "./initialization/synchronizer";
import add_annotation_data from "./middleware/add_annotation_data";
import { prevent_loops } from "./middleware/prevent_loops";

export const Middleware = {
    addAnnotationData: add_annotation_data,
    preventLoops: prevent_loops
};

export namespace InitializeExternal {
    export const plugin = initializeExternalPlugin_PluginSide;
    export const kernel = initializeExternalPlugin_KernelSide;
    export type PrimitiveMessageChannel = PrimitiveMessageChannelType;
};