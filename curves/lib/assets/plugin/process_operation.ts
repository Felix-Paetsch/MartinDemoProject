import { Operation } from "./operations";
import { LocalMethods } from "../library";
import { PluginEnvironment } from "pc-messaging-kernel/plugin";
import { FileReference } from "../types";
import { BackendOperationReturnType, SubscribeResult, UnsubscribeResult } from "../operation_result";
import { perform_operation } from "../local/process_operation";
import { active_subscriptions } from "./subscriptions";

export type BackendOperation =
    Exclude<Operation, {
        type: "SUBSCRIBE_OP" | "BATCH_OPERATION" | "ATOMIC_OPERATION"
    }>
    | {
        type: "SUBSCRIBE_OP",
        key: string,
        fr: FileReference
    }
    | {
        type: "BATCH_OPERATION",
        ops: BackendOperation[]
    }
    | {
        type: "ATOMIC_OPERATION",
        ops: BackendOperation[]
    }

export type SBackendOperation<S extends BackendOperation["type"]> = BackendOperation & {
    type: S
};

export type BackendOperationFromOperation<S extends Operation> = BackendOperation & {
    type: S["type"]
};

export function to_backend_operation<O extends Operation>(op: Operation): BackendOperationFromOperation<O> {
    if (op.type == "SUBSCRIBE_OP") {
        return {
            type: op.type,
            key: op.key,
            fr: op.fr
        }
    }

    if (op.type == "BATCH_OPERATION") {
        return {
            type: "BATCH_OPERATION",
            ops: op.ops.map(o => to_backend_operation(o))
        }
    }

    if (op.type == "ATOMIC_OPERATION") {
        return {
            type: "ATOMIC_OPERATION",
            ops: op.ops.map(o => to_backend_operation(o))
        }
    }

    return op;
}

export async function process_operations_plugin(env: PluginEnvironment, op: Operation[]) {
    const arg = {
        type: "BATCH_OPERATION",
        ops: op.map(p => to_backend_operation(p))
    } as const;

    const res: BackendOperationReturnType<any>[] | Error = await LocalMethods.perform_operation(
        env,
        arg
    ) as any;

    if (res instanceof Error) return res;

    for (let i = 0; i < op.length; i++) {
        if (op[i]?.type === "SUBSCRIBE_OP") {
            const r = res[i] as SubscribeResult;
            const o = op[i] as Operation & { type: "SUBSCRIBE_OP" };
            if (!(typeof r === "string")) {
                active_subscriptions.push({
                    ...r,
                    cb: o.cb,
                    own_address: env.address
                });
            }
        }
        if (op[i]?.type === "UNSUBSCRIBE_OP") {
            const o = op[i] as Operation & { type: "UNSUBSCRIBE_OP" };
            for (let i = active_subscriptions.length - 1; i >= 0; i--) {
                if (
                    active_subscriptions[i]?.fr == o.fr
                    && active_subscriptions[i]?.key == o.key
                ) {
                    active_subscriptions.splice(i, 1);
                }
            }
        }
    }
}

