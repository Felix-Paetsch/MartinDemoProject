import { Operation } from "./operations";
import { LocalMethods } from "../library";
import { Json, PluginEnvironment } from "pc-messaging-kernel/plugin";
import { FileReference } from "lib/assets_2/types";

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

export function to_backend_operation(op: Operation): BackendOperation {
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


export function process_operations_plugin(env: PluginEnvironment, op: Operation[]) {
    LocalMethods.process_operations(
        env,
        op.map(p => to_backend_operation(p))
    );
}

