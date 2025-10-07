import { Failure, Logging, Address } from "../../lib/src/messaging/exports";
import {
    PluginEnvironment,
    LibraryReference,
    PluginMessagePartner,
    LibraryIdent,
    AbstractLibraryImplementation,
    PluginIdent,
    KernelEnvironment,
    LibraryEnvironment,
    PsLogging,
    BranchedMessagePartner
} from "../../lib/src/pluginSystem/kernel_exports"
import { Assets } from "../../lib/src/libraries/exports";

Failure.setAnomalyHandler((e) => {
    console.log("[handle anomaly]")
    throw e;
});

Failure.setErrorHandler((e) => {
    console.log("[handle anomaly]")
    throw e;
});

const side_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING SIDE PLUGIN >>");
    env.on_plugin_request((mp: PluginMessagePartner) => {
        mp.on_branch((branch: BranchedMessagePartner) => {
            branch.on_message((data) => {
                console.log(data + ", and I must scream");
            });
            branch.on_message_listener_registered(async (bridge) => {
                await bridge.send_message("I am here");
            });
        });

        env.log("Hello from side plugin", PsLogging.Severity.INFO);
    });

    const lib = await env.get_library({
        name: "test",
        version: "1.0.0"
    });
    if (lib instanceof Error) {
        throw lib;
    }
    const res = await lib.call("hi", ["Martin"]);
    console.log(res);

    const assets = new Assets.AssetManager(env);
    const subscriptionKey = await assets.subscribe("TestFile", (fe: Assets.FileEvent) => {
        console.log(fe);
        if (fe.type === "CHANGE_FILE_CONTENT") {
            console.log(fe.contents);
        }
    });

    if (subscriptionKey instanceof Error) {
        throw subscriptionKey;
    }
}

const main_plugin = async (env: PluginEnvironment) => {
    console.log("<< STARTING MAIN PLUGIN >>")

    const assets = new Assets.AssetManager(env);

    const fr = "TestFile";
    let fileDescription = await assets.create(fr, {
        "someKey": "someValue"
    }, "Content")
    if (fileDescription instanceof Error) {
        throw fileDescription;
    }

    const mp = await env.get_plugin({
        name: "side",
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

    fileDescription = await assets.write(fr, fileDescription.recency_token, "Some new content");
    if (fileDescription instanceof Error) {
        throw fileDescription;
    }
}

let lib_ref: LibraryReference | null = null;

Logging.set_logging_target(Address.local_address);
PsLogging.start_kernel_log_to_file("./debug/logs/internal_logs.log");
let i = 0;
const shared_log_middleware = Logging.log_middleware(
    //    () => { console.log("Log", ++i) }
)

class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        //this.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        //this.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
        this.use_middleware(shared_log_middleware, "monitoring");
        //this.useMiddleware(DebugMiddleware.kernel("debug/logs/internal_logs.log"), "monitoring");
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        // env.use_middleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.use_middleware(shared_log_middleware, "monitoring");
        //env.use_middleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    register_local_library_middleware(env: LibraryEnvironment) {
        //env.useMiddleware(CommonMiddleware.addAnnotationData(), "preprocessing");
        env.use_middleware(shared_log_middleware, "monitoring");
        //env.useMiddleware(DebugMiddleware.plugin(this.address), "monitoring");
    }

    async create_library(library_ident: LibraryIdent) {
        const lib = AbstractLibraryImplementation.from_object({
            "hi": (name: string) => `Hello ${name}`
        }, () => {
            console.log("Library disposed");
            lib_ref = null;
        });
        const { ref } = this.create_local_library_environment(library_ident, lib);
        return ref;
    }

    async create_plugin(plugin_ident: PluginIdent) {
        const ident_with_id = {
            instance_id: plugin_ident.name, //uuidv4(),
            ...plugin_ident
        }

        const plugin = findCreatePlugin(plugin_ident.name);

        const { env, ref } = this.create_local_plugin_environment(ident_with_id);

        await plugin(env);
        return ref;
    }

    async start() {
        await this.get_plugin({
            "name": "assets"
        });
        return await super.start();
    }
}

function findCreatePlugin(name: string) {
    switch (name) {
        case "start": return main_plugin;
        case "assets": return Assets.__Plugin;
        case "side": return side_plugin;
    }
    return side_plugin;
}

(async () => {
    const kernel = new KernelImpl();
    await kernel.start();
})()
