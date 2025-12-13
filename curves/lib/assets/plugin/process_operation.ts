import { LocalMethods } from "../library";
import { active_subscriptions } from "./subscriptions";
import { to_backend_operation, ToBackendOperation } from "../types/backend_operations";
import { FrontendOperationResult, GenericFrontendOperationResult } from "../types/frontend_result";
import { BackendFileResult, BackendOperationError, BackendOperationResult, GenericBackendOperationResult, isBackendOperationError } from "../types/backend_result";
import { FrontendOperation, SFrontendOperation } from "../types/frontend_operations";
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";
import { backendFile_to_File } from "../types/base";

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
    const return_res: (Exclude<GenericFrontendOperationResult, BackendOperationError> | Error)[] = [];

    for (let i = 0; i < op.length; i++) {
        return_res.push(
            backendOperationReturnResult_to_frontendOperationReturnResult(
                env,
                op[i]!,
                operation_res[i] as any
            )
        )
    }

    return return_res;
}

function backendOperationReturnResult_to_frontendOperationReturnResult<
    FOperation extends FrontendOperation
>(env: PluginEnvironment, f_op: FOperation, b_ret: BackendOperationResult<ToBackendOperation<FOperation>>): FrontendOperationResult<FOperation> {
    if (isBackendOperationError(b_ret!)) {
        return new Error(b_ret);
    }

    if (f_op.type === "SUBSCRIBE_OP") {
        const {
            fr, key, cb
        } = f_op;

        active_subscriptions.push({
            fr,
            key,
            cb,
            own_address: env.address
        });

        return b_ret as any;
    }

    if (f_op.type === "UNSUBSCRIBE_OP") {
        for (let i = active_subscriptions.length - 1; i >= 0; i--) {
            if (
                active_subscriptions[i]?.fr == f_op.fr
                && active_subscriptions[i]?.key == f_op.key
            ) {
                active_subscriptions.splice(i, 1);
            }
        }

        return b_ret as any;
    }

    if (f_op.type == "FILE") {
        const typed_b_ret: Exclude<BackendFileResult, BackendOperationError> = b_ret as any;
        const return_file: FrontendOperationResult<SFrontendOperation<"FILE">> = backendFile_to_File(typed_b_ret);
        return return_file as any;
    }

    if (["ATOMIC_OPERATION", "BATCH_OPERATION"].includes(f_op.type)) {
        const typed_f_op: SFrontendOperation<"BATCH_OPERATION" | "ATOMIC_OPERATION"> = f_op as any;
        const typed_b_ret: FrontendOperationResult<SFrontendOperation<"BATCH_OPERATION">> = b_ret as any;

        const res: FrontendOperationResult<any>[] = [];
        for (let i = 0; i < typed_f_op.ops.length; i++) {
            res.push(
                backendOperationReturnResult_to_frontendOperationReturnResult(
                    env,
                    typed_f_op.ops[i] as any,
                    (typed_b_ret as any)[i]
                )
            );
        }

        return res as any;
    }

    return b_ret as any;
}
