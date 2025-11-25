import {
    PluginEnvironment
} from "pc-messaging-kernel/kernel"
import "./ui"
import "../../lib/assets/library"
// import * as Assets from "../../lib/assets/exports";

export default async (env: PluginEnvironment) => {
    const mp = await env.get_plugin({
        name: "main_react",
        version: "1.0.0"
    });

    if (mp instanceof Error) {
        throw mp;
    }

    const br = await mp.branch();
    if (br instanceof Error) {
        throw br;
    }

    await br.send_message("I have no mouth");
    br.on_message((data) => {
        console.log(data + ", and I must still scream");
    });
}
