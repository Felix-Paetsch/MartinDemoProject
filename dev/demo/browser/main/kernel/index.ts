import { Effect } from "effect";
import { Middleware, Address, Logging } from "../../../../lib/src/messaging/exports";
import { Middleware as CommonMiddleware } from "../../../../lib/src/pluginSystem/common_lib/exports";
import { KernelEnvironment } from "../../../../lib/src/pluginSystem/kernel_lib/kernel_env";
import { PluginReference } from "../../../../lib/src/pluginSystem/kernel_lib/external_references/plugin_reference";
import { PluginEnvironment } from "../../../../lib/src/pluginSystem/plugin_lib/plugin_environment";
import { LibraryReference } from "../../../../lib/src/pluginSystem/kernel_lib/external_references/library_reference";
import { LibraryEnvironment } from "../../../../lib/src/pluginSystem/library/library_environment";
import { PluginIdent } from "../../../../lib/src/pluginSystem/plugin_lib/plugin_ident";
import { LibraryIdent } from "../../../../lib/src/pluginSystem/library/library_environment";
import uuidv4 from "../../../../lib/src/utils/uuid";

import { createIframePlugin } from "./iframe_plugin";
import { createLocalPlugin, isLocalPlugin } from "./local_plugin";
import { createJSWASMLibrary } from "./wasm/library";

Logging.set_logging_target(Address.local_address);
export class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        this.use_middleware(Middleware.annotation_middleware(), "preprocessing");
        this.use_middleware(CommonMiddleware.preventLoops, "preprocessing");
        this.use_middleware(Logging.log_middleware(), "monitoring");

        Logging.process_middleware_logs_using(globalThis.logInverstigator.log.bind(globalThis.logInverstigator))
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        env.use_middleware(Middleware.annotation_middleware(), "preprocessing");
        env.use_middleware(CommonMiddleware.preventLoops, "preprocessing");
        env.use_middleware(Logging.log_middleware(), "monitoring");
    }

    register_local_library_middleware(env: LibraryEnvironment) {
        env.use_middleware(Middleware.annotation_middleware(), "preprocessing");
        env.use_middleware(CommonMiddleware.preventLoops, "preprocessing");
        env.use_middleware(Logging.log_middleware(), "monitoring");
    }

    async create_plugin(plugin_ident: PluginIdent) {
        const new_ident = {
            instance_id: uuidv4(),
            ...plugin_ident
        }

        if (await isLocalPlugin(plugin_ident) === true) {
            return await createLocalPlugin(
                this,
                new_ident,
                `../../local_plugins/${plugin_ident.name}/index.ts`
            )
        }

        return await createIframePlugin(this, new_ident, "process_" + new_ident.instance_id)
    }

    async create_library(library_ident: LibraryIdent) {
        const code = await fetch(`http://localhost:5174/${library_ident.name}.js`)
            .then(res => res.text())
            .catch(e => new Error("Failed to fetch code"));
        if (code instanceof Error) return code;
        const lib = await createJSWASMLibrary(code);
        if (lib instanceof Error) return lib;
        const { ref } = this.create_local_library_environment(library_ident, lib);
        return ref;
    };
}
