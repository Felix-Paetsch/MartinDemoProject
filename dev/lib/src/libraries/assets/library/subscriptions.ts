import { Environment } from "vite";
import { Address, Json } from "../../../messaging/exports";
import { PluginMessagePartner, uuidv4 } from "../../../pluginSystem/plugin_exports";
import { PluginEnvironment } from "../../../pluginSystem/plugin_exports";
import { FileEvent, FileReference } from "../types";
import { FileEventS } from "../schemas";
import { UUID } from "../../../utils/uuid";
import { Transcoder } from "../../../utils/exports";
import { Schema } from "effect";

export const assetConnections: Map<Address.PortID, PluginMessagePartner> = new Map();

export async function connect(env: PluginEnvironment) {
    const existingConnection = assetConnections.get(env.port.id);
    if (existingConnection) {
        if (existingConnection.is_removed) {
            existingConnection.on_remove(() => { });
            assetConnections.delete(env.port.id);
        } else if (await existingConnection.is_responsive()) {
            return existingConnection;
        }
    }

    const res = await env.get_plugin({ name: "assets" });
    if (res instanceof Error) {
        return res;
    }
    assetConnections.set(env.port.id, res);
    res.on_message(handle_subscriptions(env));
    res.on_remove(() => {
        assetConnections.delete(env.port.id);
        subscriptions = subscriptions.filter(s => {
            return s.env !== env;
        })
    });
    return res;
}

export type SubscriptionCallback = (event: FileEvent) => Promise<void>;
let subscriptions: {
    env: PluginEnvironment,
    key: string,
    cb: SubscriptionCallback,
    fr: FileReference
}[] = [];

function handle_subscriptions(env: PluginEnvironment) {
    return async function (data: Json) {
        const events = await Transcoder.SchemaTranscoder(Schema.Array(FileEventS)).decode(data);
        if (events instanceof Error) return;
        events.forEach(event => {
            subscriptions.forEach(s => {
                if (s.env === env && event.file_reference == s.fr) {
                    return s.cb(data as any);
                }
            });
        })
    }
}

export function exists_subscription(env: PluginEnvironment, fr: FileReference, other_than: UUID[] = []) {
    if (other_than.includes("all")) return false;
    return subscriptions.some(s => {
        return s.env === env && s.fr === fr && !other_than.includes(s.key);
    })
}

export function register_subscription(
    env: PluginEnvironment, fr: FileReference, key: string, cb: SubscriptionCallback
) {
    subscriptions.push({
        fr,
        cb,
        key,
        env
    });
}

export function unregister_subscription(
    env: PluginEnvironment, fr: FileReference, key: string
) {
    subscriptions = subscriptions.filter(s => {
        return s.env !== env || s.fr !== fr || (s.key !== key && key !== "all")
    })
}

export function active_subscriptions(
    env: PluginEnvironment, fr: FileReference, listening_to: readonly FileReference[]
) {
    if (!listening_to.includes(fr)) {
        subscriptions = subscriptions.filter(
            s => !(s.env === env && s.fr === fr)
        );
        return [];
    }
    return subscriptions.filter(s => {
        return s.env === env && s.fr === fr
    }).map(s => s.key);
}
