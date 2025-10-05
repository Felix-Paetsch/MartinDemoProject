import { PluginEnvironment } from "../../../pluginSystem/plugin_exports";
import { Address } from "../../../messaging/exports";
import { asset_protocol } from "./main";
import { exists_subscription } from "../library/subscriptions";
import { AssetSideBaseOperation, ClientSideBaseOperation } from "../operations";
import { AssetSideSubscriptionOperation } from "../operations/subscribe";

export function perform_operations(
    env: PluginEnvironment, operations: ClientSideBaseOperation[], type: "Bundled" | "Atomic"
) {
    return asset_protocol(
        env,
        env.port,
        new Address(
            env.kernel_process_id,
            "assets"
        ),
        {
            operations,
            type
        }
    )
}

export function perform_operation(
    env: PluginEnvironment, operation: ClientSideBaseOperation
) {
    return perform_operations(env, [operation], "Bundled");
}

export function client_side_base_operations_to_base_operations(
    env: PluginEnvironment,
    ops: ClientSideBaseOperation[]
): AssetSideBaseOperation[] {
    const res: AssetSideBaseOperation[] = [];
    let subscription_operations: (
        AssetSideSubscriptionOperation
        & { key: string }
    )[] = [];
    ops.forEach(element => {
        if ([
            "CREATE", "DELETE", "FILE", "DESCRIPTION", "FORCE_WRITE", "WRITE", "PATCH", "SET_META_DATA", "FORCE_SET_META_DATA", "UPDATE_META_DATA", "FILTER_BY_META_DATA", "DELETE_BY_META_DATA"
        ].includes(element.type)) {
            return res.push(element as any);
        }
        if (element.type === "GET_ACTIVE_SUBSCRIPTIONS") {
            return res.push({
                "type": "GET_ACTIVE_FILE_REFERENCES"
            });
        }
        // else subscribe, unsubscribe
        if (element.type === "SUBSCRIBE" || element.type === "UNSUBSCRIBE") {
            subscription_operations.push({
                type: (element as any).type,
                fr: (element as any).fr,
                key: (element as any).key
            })
        }
    });

    subscription_operations = subscription_operations.filter((o, i) => {
        if (o.type === "UNSUBSCRIBE") {
            return !(
                exists_subscription(env, o.fr, [o.key])
                || subscription_operations.some(s => {
                    return s.type === "SUBSCRIBE" && s.fr === o.fr
                })
            )
        }

        return (
            !exists_subscription(env, (o as any).fr)
            // O is Subscribe or Unsubscribe. For each case, just take the first instance 
            && subscription_operations.findIndex(
                r => (r as any).fr && (r as any).fr === (o as any).fr
            ) === i
        );
    });

    return res.concat(subscription_operations);
} 
