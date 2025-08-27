import { Effect } from "effect";
import { Middleware as DebugMiddleware } from "pc-messaging-kernel/debug";
import { Middleware as CommonMiddleware, Initialization, MessageChannel } from "pc-messaging-kernel/pluginSystem/common";
import { Plugin, PluginEnvironment } from "pc-messaging-kernel/pluginSystem/plugin";
import { Json } from "pc-messaging-kernel/utils";

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

