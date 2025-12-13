import {
    get_environment,
    assert
} from "pc-messaging-kernel/utils"
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";

export default async (env: PluginEnvironment) => {
    assert(get_environment() === "node")
    const mp = await env.get_plugin({
        name: "test"
    });

    if (mp instanceof Error) {
        throw mp;
    }
}
