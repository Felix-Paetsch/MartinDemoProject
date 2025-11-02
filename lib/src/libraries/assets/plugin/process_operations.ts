// Long term we need to think abt async stuff and so on..
// And timeouts... bla... on the other hand: responsiveness

import { Address } from "../../../messaging/exports";
import { AssetSideOperation } from "../operations";
import { ProtocolResponse } from "../protocol/main";
import { FileEvent, FileReference } from "../types";
import { OperationProcessingResult, OperationProcessor, Processors } from "./file_operation_processors";
import { active_subscriptions, SubscriptionEvent, trigger_events } from "./plugin";
import { compute_system_file_events } from "../systemFiles/system_files";
import { asImmutable, MakeMutable } from "../../../utils/mutability";

const operationOrder = [
    "FILE",
    "DESCRIPTION",
    "FILTER_BY_META_DATA",
    "SUBSCRIBE_FILE_REFERENCE",
    "UNSUBSCRIBE_FILE_REFERENCE",
    "CREATE",
    "DELETE",
    "FORCE_WRITE",
    "WRITE",
    "PATCH",
    "SET_META_DATA",
    "FORCE_SET_META_DATA",
    "UPDATE_META_DATA",
    "DELETE_BY_META_DATA",
    "GET_ACTIVE_FILE_REFERENCES"
] as const;

const _: Exclude<AssetSideOperation["type"], typeof operationOrder[number]> = 0 as never;

export function process_operations(
    ops: readonly AssetSideOperation[],
    mode: "Bundled" | "Atomic",
    partner: Address
) {
    const rollbacks: (() => void)[] = [];
    const events: (SubscriptionEvent | FileEvent)[] = [];
    const res: OperationProcessingResult = {
        fileReferences: {},
        fileReferenceArrays: [],
        errors: []
    }

    for (const op of ops) {
        const r: ReturnType<OperationProcessor<any>> = (Processors as any)[op.type](
            op,
            res,
            partner.toString()
        );
        if (r instanceof Error) {
            if (mode === "Atomic") {
                while (rollbacks.length > 0) {
                    rollbacks.pop()!();
                }
                return r;
            }
            res.errors.push(r);
        } else if (r) {
            if (r.undo) {
                rollbacks.push(r.undo);
            }
            if (r.events) {
                events.push(...r.events);
            }
        }
    }

    events.push(...compute_system_file_events(events));
    trigger_events(events);
    const result: {
        fileReferences: typeof res.fileReferences,
        fileReferenceArrays: typeof res.fileReferenceArrays,
        active_file_references?: FileReference[]
    } = {
        fileReferences: res.fileReferences,
        fileReferenceArrays: res.fileReferenceArrays
    };

    if (ops.some(o => o.type === "GET_ACTIVE_FILE_REFERENCES")) {
        result.active_file_references = active_subscriptions.filter(
            s => {
                return s.partner === partner.toString()
            }
        ).map(s => s.fr)
    }

    return result;
}
