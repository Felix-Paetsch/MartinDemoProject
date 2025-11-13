import {
    PluginEnvironment
} from "pc-messaging-kernel/kernel"
import "./ui";

export default async (env: PluginEnvironment) => {
    console.log("<< STARTING ROOT PLUGIN >>")
    const mp = await env.get_plugin({
        name: "ui_test",
        version: "1.0.0"
    });

    if (mp instanceof Error) {
        console.log("EARLY RETURNING");
        return;
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
