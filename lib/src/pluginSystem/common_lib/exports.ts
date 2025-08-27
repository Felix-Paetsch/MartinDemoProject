import { kernel_initializePlugin, MessageChannel as MessageChannelType } from "./initialization/kernelSide";
import { plugin_initializePlugin } from "./initialization/pluginSide";
import add_annotation_data from "./middleware/add_annotation_data";
import { prevent_loops } from "./middleware/prevent_loops";

export const Middleware = {
    addAnnotationData: add_annotation_data,
    preventLoops: prevent_loops
};

export const Initialization = {
    plugin: plugin_initializePlugin,
    kernel: kernel_initializePlugin,
};

export { createLocalEnvironment } from "./messageEnvironments/localEnvironment";

export type MessageChannel = MessageChannelType;