import { FileReference, File, RecencyToken } from "lib/assets/types/base";
import { SBackendOperation } from "../../types/backend_operations";
import { AssetStore } from "./base";
import {
    BackendDeleteResult,
    BackendFilterByMetaDataResult,
    BackendDescriptionResult,
    BackendForceSetMetaDataResult,
    BackendForceUpdateMetaDataResult,
    BackendSetMetaDataResult,
    BackendForceWriteResult,
    BackendCreateResult,
    BackendFileResult,
    BackendPatchResult,
    BackendUpdateMetaDataResult,
    BackendDeleteByMetaDataResult,
    BackendWriteResult,
    BackendSubscribeResult,
    BackendUnsubscribeResult,
    BackendActiveSubscriptionResult,
} from "../../types/backend_result";
import { uuidv4 } from "pc-messaging-kernel/plugin";
import { is_settable_meta_data } from "../files";
import { is_system_file } from "../system_files";
import { Address } from "pc-messaging-kernel/messaging";
import { Subscription } from "./subscription";

export class ShadowStore extends AssetStore {
    private operationHistory: {
        op: SBackendOperation<
            | "CREATE"
            | "WRITE"
            | "FORCE_WRITE"
            | "DELETE"
            | "PATCH"
            | "SET_META_DATA"
            | "FORCE_SET_META_DATA"
            | "FORCE_UPDATE_META_DATA"
            | "UPDATE_META_DATA"
            | "DELETE_BY_META_DATA"
            | "SUBSCRIBE_OP"
            | "UNSUBSCRIBE_OP"
        >;
        rt: RecencyToken;
    }[] = [];

    private deleted_files: FileReference[] = [];
    private writtenFilesStore: { [key: string]: File } = {};

    constructor(private store: AssetStore) {
        super();
    }

    commit() {
        for (const { op, rt } of this.operationHistory) {
            switch (op.type) {
                case "CREATE":
                    this.store.create_file(op, rt);
                    break;
                case "WRITE":
                    this.store.write(op, rt);
                    break;
                case "FORCE_WRITE":
                    this.store.force_write(op, rt);
                    break;
                case "DELETE":
                    this.store.delete(op);
                    break;
                case "PATCH":
                    this.store.patch(op);
                    break;
                case "SET_META_DATA":
                    this.store.set_meta_data(op, rt);
                    break;
                case "FORCE_SET_META_DATA":
                    this.store.force_set_meta_data(op, rt);
                    break;
                case "UPDATE_META_DATA":
                    this.store.update_meta_data(op, rt);
                    break;
                case "FORCE_UPDATE_META_DATA":
                    this.store.force_update_meta_data(op, rt);
                    break;
                case "DELETE_BY_META_DATA":
                    this.store.delete_by_meta_data(op);
                    break;
            }
        }

        this.operationHistory = [];
        this.deleted_files = [];
        this.writtenFilesStore = {};
    }

    get_file(op: SBackendOperation<"FILE">): BackendFileResult {
        const file = this.writtenFilesStore[op.fr];
        if (file) {
            return JSON.parse(JSON.stringify(file));
        }
        if (this.deleted_files.includes(op.fr)) {
            return `File ${op.fr} not found.`;
        }
        return this.store.get_file(op);
    }

    description(op: SBackendOperation<"DESCRIPTION">): BackendDescriptionResult {
        if (this.deleted_files.includes(op.fr)) {
            return `File ${op.fr} not found.`;
        }
        const file = this.writtenFilesStore[op.fr];
        if (file) {
            return {
                recency_token: file.recency_token,
                meta_data: file.meta_data,
            };
        }
        return this.store.description(op);
    }

    create_file(
        op: SBackendOperation<"CREATE">,
        newRT: RecencyToken = uuidv4()
    ): BackendCreateResult {
        if (this.has_file(op.fr)) return `File ${op.fr} already exists.`;
        if (!is_settable_meta_data(op.meta_data) || op.fr !== op.meta_data.fileReference) {
            return "Tried to set invalid meta data";
        }

        const entry: File = {
            meta_data: { ...op.meta_data },
            contents: op.contents,
            recency_token: newRT,
        };

        this.writtenFilesStore[op.fr] = entry;
        this.deleted_files = this.deleted_files.filter((f) => f !== op.fr);
        this.operationHistory.push({ op, rt: newRT });

        return {
            recency_token: entry.recency_token,
            meta_data: entry.meta_data,
        } as const;
    }

    write(op: SBackendOperation<"WRITE">, newRT: RecencyToken): BackendWriteResult {
        const file = this.get_file({
            type: "FILE",
            fr: op.fr
        });

        if (typeof file === "string") {
            return `File doesnt exist ${op.fr}`;
        }
        if (is_system_file(file.meta_data.fileReference)) {
            return `Can't write to file ${op.fr}`;
        }
        if (file.recency_token !== op.token) {
            return `Recency token for file ${op.fr} in WRITE operation outdated.`;
        }

        this.writtenFilesStore[op.fr] = {
            ...file,
            contents: op.contents,
            recency_token: newRT,
        };
        this.operationHistory.push({ op, rt: newRT });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    force_write(
        op: SBackendOperation<"FORCE_WRITE">,
        newRT: RecencyToken
    ): BackendForceWriteResult {
        const file = this.get_file({
            type: "FILE",
            fr: op.fr
        });

        if (typeof file === "string") {
            return `File doesnt exist ${op.fr}`;
        }
        if (is_system_file(file.meta_data.fileReference)) {
            return `Can't write to system file ${op.fr}`;
        }

        this.writtenFilesStore[op.fr] = {
            ...file,
            contents: op.contents,
            recency_token: newRT,
        };
        this.operationHistory.push({ op, rt: newRT });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    delete(op: SBackendOperation<"DELETE">): BackendDeleteResult {
        const descr = this.description({ type: "DESCRIPTION", fr: op.fr });
        if (typeof descr == "string") return { fileExisted: false };
        if (is_system_file(op.fr)) {
            return `File ${op.fr} currently cant be deleted.`;
        }

        delete this.writtenFilesStore[op.fr];
        this.deleted_files.push(op.fr);
        this.operationHistory.push({ op, rt: "" });

        return { fileExisted: true };
    }

    patch(op: SBackendOperation<"PATCH">): BackendPatchResult {
        return "unimplemented";
    }

    set_meta_data(
        op: SBackendOperation<"SET_META_DATA">,
        newRT = uuidv4()
    ): BackendSetMetaDataResult {
        const file = this.get_file({
            type: "FILE",
            fr: op.fr
        });
        if (typeof file === "string") return `File ${op.fr} doesnt exists.`;
        if (file.recency_token !== op.token) {
            return `Recency token for file ${op.fr} outdated.`;
        }
        if (is_system_file(file.meta_data.fileReference)) {
            return "Cant set meta data of system file";
        }
        if (
            !is_settable_meta_data(op.meta_data) ||
            op.fr !== file.meta_data.fileReference
        ) {
            return "Tried to set invalid meta data";
        }

        this.writtenFilesStore[op.fr] = {
            ...file,
            meta_data: op.meta_data,
            recency_token: newRT,
        };
        this.operationHistory.push({ op, rt: newRT });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    force_set_meta_data(
        op: SBackendOperation<"FORCE_SET_META_DATA">,
        newRT = uuidv4()
    ): BackendForceSetMetaDataResult {
        const file = this.get_file({
            type: "FILE",
            fr: op.fr
        });
        if (typeof file === "string") return `File ${op.fr} doesnt exists.`;
        if (
            !is_settable_meta_data(op.meta_data) ||
            op.fr !== file.meta_data.fileReference
        ) {
            return "Tried to set invalid meta data";
        }

        this.writtenFilesStore[op.fr] = {
            ...file,
            meta_data: op.meta_data,
            recency_token: newRT,
        };
        this.operationHistory.push({ op, rt: newRT });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    update_meta_data(
        op: SBackendOperation<"UPDATE_META_DATA">,
        newRT = uuidv4()
    ): BackendUpdateMetaDataResult {
        const file = this.get_file({
            type: "FILE",
            fr: op.fr
        });
        if (typeof file === "string") return `File ${op.fr} doesnt exists.`;

        const md = { ...file.meta_data, ...op.update_with };
        if (!is_settable_meta_data(md) || op.fr !== md.fileReference) {
            return "Tried to set invalid meta data";
        }
        if (op.token !== file.recency_token) {
            return "Outdated recency token";
        }

        this.writtenFilesStore[op.fr] = {
            ...file,
            meta_data: md,
            recency_token: newRT,
        };
        this.operationHistory.push({ op, rt: newRT });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    force_update_meta_data(
        op: SBackendOperation<"FORCE_UPDATE_META_DATA">,
        newRT = uuidv4()
    ): BackendForceUpdateMetaDataResult {
        const file = this.get_file({
            type: "FILE",
            fr: op.fr
        });
        if (typeof file === "string") return `File ${op.fr} doesnt exists.`;

        const md = { ...file.meta_data, ...op.update_with };
        if (!is_settable_meta_data(md) || op.fr !== md.fileReference) {
            return "Tried to set invalid meta data";
        }

        this.writtenFilesStore[op.fr] = {
            ...file,
            meta_data: md,
            recency_token: newRT,
        };
        this.operationHistory.push({ op, rt: newRT });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    filter_by_meta_data(
        op: SBackendOperation<"FILTER_BY_META_DATA">
    ): BackendFilterByMetaDataResult {
        const regex: [string, RegExp][] = [];
        try {
            Object.keys(op.filter_by).forEach((k: string) => {
                regex.push([k, new RegExp(op.filter_by[k]!)]);
            });
        } catch (e: any) {
            return `Invalid RegExp: ${e.message!}`;
        }

        const result1 = this.store.filter_by_meta_data(
            op
        ) as Exclude<BackendFilterByMetaDataResult, string>;
        const result2 = Object.values(this.writtenFilesStore).filter((f) => {
            for (const [key, reg] of regex) {
                if (
                    typeof f.meta_data[key] === "undefined" ||
                    !reg.test(f.meta_data[key])
                ) {
                    return false;
                }
            }
            return true;
        });

        return [
            ...result1.filter(
                (r) =>
                    !this.deleted_files.includes(r.meta_data.fileReference) &&
                    !result2.some(
                        (rr) => rr.meta_data.fileReference === r.meta_data.fileReference
                    )
            ),
            ...result2,
        ];
    }

    delete_by_meta_data(
        op: SBackendOperation<"DELETE_BY_META_DATA">
    ): BackendDeleteByMetaDataResult {
        const to_delete = this.filter_by_meta_data({
            type: "FILTER_BY_META_DATA",
            filter_by: op.delete_by,
        });
        if (typeof to_delete == "string") return to_delete;
        const to_delete_fr = to_delete.map((t) => t.meta_data.fileReference);
        this.deleted_files.push(...to_delete_fr);
        for (const key of to_delete_fr) {
            delete this.writtenFilesStore[key];
        }

        this.operationHistory.push({ op, rt: "" });
        return to_delete_fr;
    }


    private subscriptions: Subscription[] = [];
    private unsubscriptions: SBackendOperation<"UNSUBSCRIBE_OP">[] = [];
    subscribe(addr: Address, op: SBackendOperation<"SUBSCRIBE_OP">): BackendSubscribeResult {
        if (!this.has_file(op.fr)) {
            return `File ${op.fr} not found to subscribe to`;
        }

        this.subscriptions.push({
            address: addr,
            key: op.key,
            fr: op.fr
        });

        return {
            key: op.key,
            fr: op.fr
        }
    }

    unsubscribe(addr: Address, op: SBackendOperation<"UNSUBSCRIBE_OP">): BackendUnsubscribeResult {
        this.unsubscriptions.push(op);
        this.operationHistory.push({
            op,
            rt: ""
        });
        this.subscriptions = this.subscriptions.filter(s => s.fr === op.fr && s.key === op.key);
        return null;
    }

    get_active_subscriptions(addr: Address, op: SBackendOperation<"GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE">): BackendActiveSubscriptionResult {
        const underlying = this.store.get_active_subscriptions(addr, op);
        const non_removed = underlying.filter(s => {
            return !this.unsubscriptions.some(op => {
                return op.fr === s.fr && op.key === s.key
            })
        });
        return [...non_removed, ...this.subscriptions]
    }
}
