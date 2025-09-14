import { Effect } from "effect";
import { Middleware as DebugMiddleware } from "pc-messaging-kernel/debug";
import { Middleware as CommonMiddleware } from "../../lib/src/pluginSystem/common_lib/exports";
import { Plugin, PluginEnvironment } from "../../lib/src/pluginSystem/plugin_lib/exports";
import { Json } from "../../lib/src/utils/exports";

console.log("EXECUTING");
export default (plugin: Plugin) => {
    const channel: MessageChannel = {
        send: (msg: Json) => {
            (globalThis as any)._send_message(msg);
        },
        recieve: (cb: (data: Json) => void) => {
            (globalThis as any)._on_message = (arg: Json) => {
                console.log("Recieved msg: ", arg);
                cb(arg);
            }
        }
    };

    Initialization.plugin(
        channel,
        (plugin_env: PluginEnvironment) => {
            return Effect.gen(function* () {
                plugin_env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
                plugin_env.useMiddleware(DebugMiddleware.plugin(plugin_env.kernel_address), "monitoring");
            });
        },
        plugin
    );
}

