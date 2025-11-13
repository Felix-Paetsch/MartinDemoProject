import { LocalLibrary } from "pc-messaging-kernel/libraries";
import { process_operations_core } from "./local/process_operation";

export const AssetLibrary = new LocalLibrary.RecordLibrary(
    {
        process_operations: process_operations_core
    } as const,
    {

    },
    "ui_library"
);

export const LocalMethods = AssetLibrary.library_methods_record();
export const PluginMethods = AssetLibrary.plugin_methods_record();
