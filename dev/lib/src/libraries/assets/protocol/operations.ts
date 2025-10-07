import { PluginEnvironment } from "../../../pluginSystem/plugin_exports";
import { Address } from "../../../messaging/exports";
import { asset_protocol } from "./main";
import { exists_subscription } from "../library/subscriptions";
import { AssetSideOperation, ClientSideOperation } from "../operations";
import { AssetSideSubscriptionOperation } from "../operations/subscribe_asset";

export function perform_operations(
    env: PluginEnvironment, operations: ClientSideOperation[], type: "Bundled" | "Atomic"
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
    env: PluginEnvironment, operation: ClientSideOperation
) {
    return perform_operations(env, [operation], "Bundled");
}

export function clientSide_to_assetSide_operations(
    env: PluginEnvironment,
    ops: ClientSideOperation[]
): AssetSideOperation[] {
    const res: AssetSideOperation[] = [];
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
        if (element.type === "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE") {
            return res.push({
                "type": "GET_ACTIVE_FILE_REFERENCES"
            });
        }
        // else subscribe, unsubscribe
        if (element.type === "SUBSCRIBE_CB") {
            subscription_operations.push({
                type: "SUBSCRIBE_FILE_REFERENCE",
                fr: element.fr,
                key: element.key
            })
        } else if (element.type === "UNSUBSCRIBE_CB") {
            subscription_operations.push({
                type: "UNSUBSCRIBE_FILE_REFERENCE",
                fr: element.fr,
                key: element.key
            })
        }
    });

    subscription_operations = subscription_operations.filter((o, i) => {
        if (o.type === "UNSUBSCRIBE_FILE_REFERENCE") {
            return !(
                exists_subscription(env, o.fr, [o.key])
                || subscription_operations.some(s => {
                    return s.type === "SUBSCRIBE_FILE_REFERENCE" && s.fr === o.fr
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
