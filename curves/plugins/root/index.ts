import {
    PluginEnvironment
} from "pc-messaging-kernel/kernel"

export default async (env: PluginEnvironment) => {
    console.log("<< STARTING ROOT PLUGIN >>")
    const mp = await env.get_plugin({
        name: "side",
        version: "1.0.0"
    });

    if (mp instanceof Error) {
        console.log("THROWING");
        throw mp;
    }

    const br = await mp.bridge();
    if (br instanceof Error) {
        throw br;
    }

    await br.send("I have no mouth");
    br.on((data) => {
        console.log(data + ", and I must still scream");
    });
}
