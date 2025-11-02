import {
    KernelEnvironment,
    uuidv4,
    PluginIdent,
    LibraryIdent,
} from "../../../../src/pluginSystem/kernel_exports";

import { createIframePlugin } from "./iframe_plugin";
import { createLocalPlugin, isLocalPlugin } from "./local_plugin";
import { createJSWASMLibrary } from "./wasm/library";

export class KernelImpl extends KernelEnvironment {
    async create_plugin(plugin_ident: PluginIdent) {
        const ident_with_id = {
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

    create_library(library_ident: LibraryIdent): Promise<LibraryReference | GetLibraryError> {
        throw new Error("Unimplemeted")
    };
}
