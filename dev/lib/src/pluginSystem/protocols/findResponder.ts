import { PluginIdentWithInstanceId } from "../plugin_lib/plugin_ident";
import { KernelEnvironment } from "../kernel_lib/kernel_env";
import { PluginEnvironment } from "../plugin_lib/plugin_environment";
import { Json } from "../../utils/json";
import { Effect, Schema } from "effect";
import { pluginIdentWithInstanceIdSchema } from "../plugin_lib/plugin_ident";
import { libraryIdentSchema, LibraryIdent, LibraryEnvironment } from "../library/library_environment";
import { MessagePartner } from "../plugin_lib/message_partner/base";

export function findKernel(): KernelEnvironment | null {
    return KernelEnvironment.singleton;
}

export function findPlugin(plugin_ident: string | PluginIdentWithInstanceId | Json): PluginEnvironment | null {
    let instance_id: string | undefined;
    if (typeof plugin_ident === "string") {
        instance_id = plugin_ident;
    } else {
        try {
            instance_id = Schema.decodeUnknownSync(pluginIdentWithInstanceIdSchema)(plugin_ident).instance_id;
        } catch (error) {
            return null;
        }
    }
    return PluginEnvironment.plugins.find(plugin => plugin.plugin_ident.instance_id === instance_id) || null;
}

export function findLibrary(library_ident: LibraryIdent): LibraryEnvironment | null {
    const ident = Schema.decodeUnknown(libraryIdentSchema)(library_ident).pipe(
        Effect.orElse(() => Effect.succeed(null)),
        Effect.runSync
    );
    if (!ident) return null;
    return LibraryEnvironment.libraries.find(
        lib => lib.library_ident.name === ident.name && lib.library_ident.version === ident.version
    ) || null;
}

export function findMessagePartner<S extends MessagePartner, T extends new (...args: any[]) => S>(type?: T):
    (ident: string) => S | null {
    return (ident: string) => {
        return (MessagePartner.message_partners.find(
            mp => (mp.own_uuid === ident) && (type ? mp instanceof type : true)
        ) as S | undefined) || null;
    }
}
