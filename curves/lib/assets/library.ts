import { LocalLibrary } from "pc-messaging-kernel/libraries";
import { perform_operation } from "./local/process_operation";
import { trigger_file_events } from "./plugin/subscriptions";

const AssetLibrary = new LocalLibrary.RecordLibrary(
    {
        perform_operation
    } as const,
    {
        trigger_file_events
    } as const,
    "asset_library"
);

export const LocalMethods = AssetLibrary.library_methods_record();
export const PluginMethods = AssetLibrary.plugin_methods_record();

export * from "./types/frontend_operations"
