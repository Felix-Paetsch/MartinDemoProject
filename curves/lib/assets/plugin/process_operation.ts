import { LocalMethods } from "../library";
import { PluginEnvironment } from "pc-messaging-kernel/plugin";
import { active_subscriptions } from "./subscriptions";
import { to_backend_operation, ToBackendOperation } from "../types/backend_operations";
import { GenericFrontendOperationResult } from "../types/frontend_result";
import { BackendOperationError, BackendOperationResult, GenericBackendOperationResult, isBackendOperationError } from "../types/backend_result";
import { FrontendOperation } from "../types/frontend_operations";

export async function process_operations_plugin(env: PluginEnvironment, op: FrontendOperation[]): Promise<GenericFrontendOperationResult[] | Error> {
    const batch_operation = {
        type: "BATCH_OPERATION",
        ops: op.map(p => to_backend_operation(p))
    } as const;

    const operation_res = await LocalMethods.perform_operation(
        env,
        batch_operation
    ) as Error | GenericBackendOperationResult[];

    if (operation_res instanceof Error) return operation_res;
    const return_res: (Exclude<GenericFrontendOperationResult, string> | Error)[] = [];

    for (let i = 0; i < op.length; i++) {
        const cop = op[i]!;
        const rop = operation_res[i];

        if (isBackendOperationError(rop!)) {
            return_res.push(new Error(rop));
            continue;
        }

        if (cop.type === "SUBSCRIBE_OP") {
            const {
                fr, key, cb
            } = cop;

            const trop = rop as BackendOperationResult<ToBackendOperation<typeof cop>>
            active_subscriptions.push({
                fr,
                key,
                cb,
                own_address: env.address
            });
            return_res.push(trop as Exclude<typeof trop, string>);
            continue;
        }

        if (cop.type === "UNSUBSCRIBE_OP") {
            for (let i = active_subscriptions.length - 1; i >= 0; i--) {
                if (
                    active_subscriptions[i]?.fr == cop.fr
                    && active_subscriptions[i]?.key == cop.key
                ) {
                    active_subscriptions.splice(i, 1);
                }
            }

            const trop = rop as BackendOperationResult<ToBackendOperation<typeof cop>>
            return_res.push(trop as Exclude<typeof trop, BackendOperationError>);
            continue;
        }

        const trop = rop as BackendOperationResult<ToBackendOperation<typeof cop>>
        return_res.push(trop as Exclude<typeof trop, BackendOperationError>);
    }

    return return_res;
}

