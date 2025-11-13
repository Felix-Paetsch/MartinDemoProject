import { Address } from "pc-messaging-kernel/messaging";
import { BackendOperation } from "../plugin/process_operation";
import { Json } from "pc-messaging-kernel/utils";
import { perform_file } from "./perform_operation";
import { FileEvent, File } from "../types";
import { Store } from "./state";
import { uuidv4 } from "pc-messaging-kernel/plugin";

type commulativeOperation = BackendOperation & {
    type: "BATCH_OPERATION" | "ATOMIC_OPERATION"
}

export function process_operations_core(address: Address, op: commulativeOperation) {
    return op.ops.map(o => perform_operation(address, o));
}

function perform_operation(address: Address, op: BackendOperation) {
    switch (op.type) {
        case "BATCH_OPERATION":
            return op.ops.map(p => perform_operation(address, p));
        case "ATOMIC_OPERATION":
            return op.ops.map(p => perform_operation(address, p));
        case "FILE":
            return Store[op.fr] || new Error(`File ${op.fr} not found.`);
        case "CREATE":
            const file = Store[op.fr];
            if (file) return new Error(`File ${op.fr} already exists.`);
            const entry: File = {
                meta_data: {
                    fileReference: op.fr,
                    fileType: "LOCAL",
                    ...op.meta_data
                },
                contents: op.contents,
                recency_token: uuidv4()
            };
            Store[op.fr] = entry;
            return {
                recency_token: entry.recency_token,
                meta_data: entry.meta_data
            } as const
        case "WRITE":
            const file2 = Store[op.fr];
            if (!file2) return new Error(`File ${op.fr} doesnt exists.`);
            if (file2.recency_token !== op.token) {
                return new Error(`Recency token for file ${op.fr} in WRITE operation outdated.`);
            }
            file2.contents = op.contents;
            file2.recency_token = uuidv4();
            return {
                recency_token: file2.recency_token,
                meta_data: file2.meta_data
            } as const;
        case "FORCE_WRITE":
            const file3 = Store[op.fr];
            if (!file3) return new Error(`File ${op.fr} doesnt exists.`);
            file3.contents = op.contents;
            file3.recency_token = uuidv4();
            return {
                recency_token: file3.recency_token,
                meta_data: file3.meta_data
            } as const;
        case "DELETE":
            const file4 = Store[op.fr];
            if (!file4) return null;
            if (file4.meta_data.fileType !== "LOCAL") {
                return new Error(`File ${file4.meta_data.fileReference} currently cant be deleted.`);
            }
            delete Store[op.fr];
            return null;
        case "PATCH":
            return new Error("Currently unimplemented");
        case "DESCRIPTION":
            const file5 = Store[op.fr];
            if (!file5) return new Error(`File ${op.fr} not found.`);
            return {
                recency_token: file5.recency_token,
                meta_data: file5.meta_data
            } as const;
    }
}
