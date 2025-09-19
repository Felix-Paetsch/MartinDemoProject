import { Address, Logging, Middleware } from "pc-messaging-kernel/messaging";
import {
    PsMiddleware,
    KernelEnvironment,
    PluginEnvironment,
    uuidv4,
    LibraryEnvironment,
    PluginIdent,
    LibraryIdent,
    PluginIdentWithInstanceId,
    Json
} from "pc-messaging-kernel/kernel";

import { createIframePlugin } from "./iframe_plugin";
import { createLocalPlugin, isLocalPlugin } from "./local_plugin";
import { createJSWASMLibrary } from "./wasm/library";

Logging.set_logging_target(Address.local_address);
export class KernelImpl extends KernelEnvironment {
    register_kernel_middleware() {
        this.use_middleware(Middleware.annotation_middleware(), "preprocessing");
        this.use_middleware(PsMiddleware.PreventLoops, "preprocessing");
        this.use_middleware(Logging.log_middleware(), "monitoring");

        Logging.process_middleware_logs_using(globalThis.logInverstigator.log.bind(globalThis.logInverstigator))
    }

    register_local_plugin_middleware(env: PluginEnvironment) {
        env.use_middleware(Middleware.annotation_middleware(), "preprocessing");
        env.use_middleware(PsMiddleware.PreventLoops, "preprocessing");
        env.use_middleware(Logging.log_middleware(), "monitoring");
    }

    register_local_library_middleware(env: LibraryEnvironment) {
        env.use_middleware(Middleware.annotation_middleware(), "preprocessing");
        env.use_middleware(PsMiddleware.PreventLoops, "preprocessing");
        env.use_middleware(Logging.log_middleware(), "monitoring");
    }

    async recieve_plugin_message(msg: Json, plugin: PluginIdentWithInstanceId): Promise<boolean> {
        const handled = await super.recieve_plugin_message(msg, plugin);
        if (handled) return true;
        // Should be typechecked
        const remove_what: PluginIdentWithInstanceId | null = (msg as any).what;
        const ref = this.get_plugin_reference(remove_what)
        if (ref) {
            await this.remove_plugin(ref);
            return true;
        }
        return false;
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

        console.log("create iframe plugin");
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
