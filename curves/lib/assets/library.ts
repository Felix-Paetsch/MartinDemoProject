import { LocalLibrary } from "pc-messaging-kernel/libraries";
import { perform_operation } from "./local/process_operation";
import { trigger_file_event } from "./plugin/subscriptions";

export const AssetLibrary = new LocalLibrary.RecordLibrary(
    {
        perform_operation
    } as const,
    {
        trigger_file_event
    } as const,
    "asset_library"
);

export const LocalMethods = AssetLibrary.library_methods_record();
export const PluginMethods = AssetLibrary.plugin_methods_record();

export * from "./operations"
