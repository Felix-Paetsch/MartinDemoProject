import { Record } from "effect";
import { Address } from "../../messaging/exports";
import { PluginEnvironment, Plugin, PluginMessagePartner } from "../../pluginSystem/exports"
import type Library from "./library";

const messagePartnerMap = new Map<Address.StringSerializedAddress, PluginMessagePartner>();
export function addressToMessagePartner(a: Address) {
    return messagePartnerMap.get(a.toString());
}

const libraries: Record<string, Library> = {};
export function add_library(name: string, lib: Library) {
    libraries[name] = lib;
}

export function get_library(name: string) {
    return libraries[name] || null;
}

export const LocalLibraryPlugin: Plugin = (env: PluginEnvironment) => {
    env.on_plugin_request((mp) => {
        messagePartnerMap.set(mp.address.toString(), mp);
        mp.on_remove(async () => {
            const addressString = mp.address.toString();
            messagePartnerMap.delete(addressString);
            await Promise.all(
                Object.values(libraries).map(
                    lib => lib.on_message_partner_remove(mp.address)
                )
            );
        });
    });
    return;
}


