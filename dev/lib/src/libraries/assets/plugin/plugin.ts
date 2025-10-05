import { Address } from "../../../messaging/exports";
import { PluginEnvironment, Plugin, PluginMessagePartner } from "../../../pluginSystem/plugin_exports"
import { FileEvent, FileReference } from "../types";
import { Json } from "../../../utils/exports";

const messagePartnerMap = new Map<Address.StringSerializedAddress, PluginMessagePartner>();

export const AssetPlugin: Plugin = (env: PluginEnvironment) => {
    env.on_plugin_request((mp) => {
        messagePartnerMap.set(mp.address.toString(), mp);
        mp.on_remove(() => {
            const addressString = mp.address.toString();
            messagePartnerMap.delete(addressString);
            for (let i = active_subscriptions.length - 1; i >= 0; i--) {
                if (active_subscriptions[i]?.partner.toString() === addressString) {
                    active_subscriptions.splice(i, 1);
                }
            }
        });
    });
    return;
}

export const active_subscriptions: {
    fr: FileReference,
    partner: Address.StringSerializedAddress
}[] = [];

export type SubscriptionEvent = {
    type: "SUBSCRIBE",
    partner: Address.StringSerializedAddress,
    fr: FileReference
} | {
    type: "UNSUBSCRIBE",
    partner: Address.StringSerializedAddress,
    fr: FileReference
}

export function trigger_events(events: (FileEvent | SubscriptionEvent)[]) {
    // All unsubscribes arent send
    // All subscribes arent send
    const unsubs = events.filter(e => e.type === "UNSUBSCRIBE");
    for (let i = active_subscriptions.length - 1; i >= 0; i--) {
        const as = active_subscriptions[i]!;
        if (
            unsubs.some(e => (
                as.fr == e.fr
                && as.partner == e.partner
            ))
        ) {
            active_subscriptions.splice(i, 1);
        }
    }

    const eventsToTrigger = events.filter(
        e => !["SUBSCRIBE", "UNSUBSCRIBE"].includes(e.type)
    ) as FileEvent[];
    const grouped = group_by(eventsToTrigger, e => e.file_reference);
    const messagesToSend: { [key: Address.StringSerializedAddress]: FileEvent[] } = {};

    for (const as of active_subscriptions) {
        for (const fr of Object.keys(grouped)) {
            if (as.fr === fr) {
                const msg_arr = messagesToSend[as.partner];
                if (msg_arr) {
                    msg_arr.push(...grouped[fr]!);
                } else {
                    messagesToSend[as.partner] = [...grouped[fr]!];
                }
            }
        }
    }

    for (const key of Object.keys(messagesToSend) as Address.StringSerializedAddress[]) {
        const mp = messagePartnerMap.get(key);
        if (!mp) continue;
        mp.send_message(messagesToSend[key] as Json);
    }

    events.filter(e => e.type === "SUBSCRIBE").forEach((e) => {
        if (active_subscriptions.some(s => {
            return s.partner === e.partner && s.fr === e.fr
        })) {
            return;
        }
        active_subscriptions.push({
            partner: e.partner,
            fr: e.fr
        });
    });
}

function group_by<Obj>(
    objects: Obj[],
    key: (a: Obj) => string,
    equal_key?: (a: Obj, b: string) => boolean
): { [key: string]: Obj[] } {
    const res: { [key: string]: Obj[] } = {};
    const keys: string[] = [];
    if (!equal_key) {
        equal_key = (a: Obj, b: string) => key(a) === b
    }

    for (const o of objects) {
        const existingKey = keys.find(k => equal_key(o, k));

        if (existingKey) {
            res[existingKey]!.push(o);
        } else {
            const newKey = key(o);
            res[newKey] = [o];
            keys.push(newKey);
        }
    }

    return res;
}

