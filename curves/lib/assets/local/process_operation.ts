import { Address } from "pc-messaging-kernel/messaging";
import { BackendOperation } from "../types/backend_operations";
import { AssetStore } from "./store/base";
import { ShadowStore } from "./store/shadow";
import { liveStore } from "./store/live";
import { GenericBackendOperationResult } from "../types/backend_result";


export function perform_operation_with_store(
    address: Address,
    op: BackendOperation,
    store: AssetStore
): GenericBackendOperationResult {
    switch (op.type) {
        case "BATCH_OPERATION":
            return op.ops.map((p: BackendOperation) => {
                const r = perform_operation_with_store(address, p, store);
                if (r instanceof Error) {
                    return r.name;
                }
                return r as any;
            });
        case "ATOMIC_OPERATION":
            const shadow = new ShadowStore(store);
            const res = [];
            for (const p of op.ops) {
                const r = perform_operation_with_store(address, p, shadow);
                if (r instanceof Error) {
                    return r.name
                }
                if (typeof r === "string") {
                    return r;
                }
                res.push(r);
            }

            shadow.commit();
            return res;
        case "FILE":
            return store.get_file(op);
        case "CREATE":
            return store.create_file(op);
        case "WRITE":
            return store.write(op);
        case "FORCE_WRITE":
            return store.force_write(op);
        case "DELETE":
            return store.delete(op);
        case "PATCH":
            return store.patch(op);
        case "DESCRIPTION":
            return store.description(op);
        case "SET_META_DATA":
            return store.set_meta_data(op);
        case "FORCE_SET_META_DATA":
            return store.force_set_meta_data(op);
        case "UPDATE_META_DATA":
            return store.update_meta_data(op);
        case "FORCE_UPDATE_META_DATA":
            return store.force_update_meta_data(op);
        case "FILTER_BY_META_DATA":
            return store.filter_by_meta_data(op);
        case "DELETE_BY_META_DATA":
            return store.delete_by_meta_data(op);
        case "SUBSCRIBE_OP":
            return store.subscribe(address, op);
        case "UNSUBSCRIBE_OP":
            return store.unsubscribe(address, op);
        case "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE":
            return store.get_active_subscriptions(address, op);
    }

    return `Invalid Operation: ${JSON.stringify(op)}`
}

export function perform_operation(a: Address, op: BackendOperation) {
    // console.log("PERFORMING OP", op);
    const res = perform_operation_with_store(a, op, liveStore);
    liveStore.dispatch_file_events();
    return res;
}
