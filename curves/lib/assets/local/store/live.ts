import { AssetStore } from "./base";
import { BackendFile, FileReference, RecencyToken } from "../../types/base";
import { uuidv4 } from "pc-messaging-kernel/utils";
import { is_system_file } from "../system_files";
import { fill_meta_data_values, is_settable_meta_data } from "../meta_data_tools";
import { SBackendOperation } from "../../types/backend_operations";
import { BackendActiveSubscriptionResult, BackendSubscribeResult, BackendUnsubscribeResult } from "../../types/backend_result";
import { Subscription } from "./subscription";
import { Address } from "pc-messaging-kernel/messaging";
import { PluginMethods } from "../../library";
import { BackendFileEvent, BoundBackendFileEvent } from "../../types/backend_file_events";

class LiveStore extends AssetStore {
    private Store: { [key: string]: BackendFile } = {};

    get_file(op: SBackendOperation<"FILE">) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} not found.`;
        return JSON.parse(JSON.stringify(file));
    }

    create_file(op: SBackendOperation<"CREATE">, newRT: RecencyToken = uuidv4()) {
        const existing = this.Store[op.fr];
        if (existing) return `File ${op.fr} already exists.`;

        const meta_data = fill_meta_data_values(op.meta_data, op.fr);
        if (
            !is_settable_meta_data(meta_data, op.fr)
        ) {
            return "Tried to set invalid meta data";
        }
        const entry: BackendFile = {
            meta_data,
            contents: op.contents,
            recency_token: newRT,
        };
        this.Store[op.fr] = entry;
        return {
            recency_token: entry.recency_token,
            meta_data: entry.meta_data,
        } as const;
    }

    write(op: SBackendOperation<"WRITE">, newRT: RecencyToken = uuidv4()) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} doesnt exists.`;
        if (file.recency_token !== op.token) {
            return `Recency token for file ${op.fr} in WRITE operation outdated.`;
        }
        file.contents = JSON.parse(JSON.stringify(op.contents));
        file.recency_token = newRT;

        this.handle_file_event({
            type: "CHANGE_FILE_CONTENT",
            contents: file.contents,
            file_reference: file.meta_data.fileReference,
            recency_token: file.recency_token,
            meta_data: { ...file.meta_data }
        });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    force_write(op: SBackendOperation<"FORCE_WRITE">, newRT: RecencyToken = uuidv4()) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} doesnt exists.`;
        file.contents = op.contents;
        file.recency_token = newRT;

        this.handle_file_event({
            type: "CHANGE_FILE_CONTENT",
            contents: file.contents,
            file_reference: file.meta_data.fileReference,
            recency_token: file.recency_token,
            meta_data: { ...file.meta_data }
        });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    delete(op: SBackendOperation<"DELETE">) {
        const file = this.Store[op.fr];
        if (!file) return { fileExisted: false };
        if (file.meta_data.fileType !== "LOCAL") {
            return `File ${file.meta_data.fileReference} currently cant be deleted.`;
        }

        this.handle_file_event({
            type: "DELETE",
            file_reference: file.meta_data.fileReference
        });

        delete this.Store[op.fr];
        return { fileExisted: true };
    }

    patch(op: SBackendOperation<"PATCH">) {
        return "Currently Unimplemented";
    }

    description(op: SBackendOperation<"DESCRIPTION">) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} not found.`;
        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    set_meta_data(op: SBackendOperation<"SET_META_DATA">, newRT: RecencyToken = uuidv4()) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} not found.`;
        if (file.recency_token !== op.token)
            return `File recency token outdated.`;
        if (is_system_file(file.meta_data.fileReference)) {
            return `Can't write to system file ${op.fr}`;
        }

        const meta_data = fill_meta_data_values(op.meta_data, op.fr, file.meta_data.fileType as any);

        if (
            !is_settable_meta_data(meta_data, op.fr)
        ) {
            return "Tried to set invalid meta data";
        }

        file.meta_data = meta_data;
        file.recency_token = newRT;

        this.handle_file_event({
            type: "CHANGE_META_DATA",
            file_reference: file.meta_data.fileReference,
            recency_token: file.recency_token,
            meta_data: { ...file.meta_data }
        });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    force_set_meta_data(op: SBackendOperation<"FORCE_SET_META_DATA">, newRT: RecencyToken = "" + performance.now()) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} not found.`;
        if (is_system_file(file.meta_data.fileReference)) {
            return `Can't write to system file ${op.fr}`;
        }

        const meta_data = fill_meta_data_values(op.meta_data, op.fr, file.meta_data.fileType as any);
        if (
            !is_settable_meta_data(meta_data, op.fr)
        ) {
            return "Tried to set invalid meta data";
        }

        file.meta_data = meta_data;
        file.recency_token = newRT;

        this.handle_file_event({
            type: "CHANGE_META_DATA",
            file_reference: file.meta_data.fileReference,
            recency_token: file.recency_token,
            meta_data: { ...file.meta_data }
        });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    force_update_meta_data(op: SBackendOperation<"FORCE_UPDATE_META_DATA">, newRT: RecencyToken = "" + performance.now()) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} not found.`;
        if (is_system_file(file.meta_data.fileReference)) {
            return `Can't write to system file ${op.fr}`;
        }

        const md = {
            ...file.meta_data,
            ...op.update_with,
        };

        if (
            !is_settable_meta_data(md, op.fr)
        ) {
            return "Tried to set invalid meta data";
        }

        file.meta_data = md;
        file.recency_token = newRT;
        this.handle_file_event({
            type: "CHANGE_META_DATA",
            file_reference: file.meta_data.fileReference,
            recency_token: file.recency_token,
            meta_data: { ...file.meta_data }
        });

        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    update_meta_data(op: SBackendOperation<"UPDATE_META_DATA">, newRT: RecencyToken = "" + performance.now()) {
        const file = this.Store[op.fr];
        if (!file) return `File ${op.fr} not found.`;
        if (is_system_file(file.meta_data.fileReference)) {
            return `Can't write to system file ${op.fr}`;
        }

        const md = {
            ...file.meta_data,
            ...op.update_with,
        };

        if (op.token !== file.recency_token) {
            return "Recency Token Outdated";
        }
        if (
            !is_settable_meta_data(md, op.fr)
        ) {
            return "Tried to set invalid meta data";
        }

        file.meta_data = md;
        file.recency_token = newRT;

        this.handle_file_event({
            type: "CHANGE_META_DATA",
            file_reference: file.meta_data.fileReference,
            recency_token: file.recency_token,
            meta_data: { ...file.meta_data }
        });
        return {
            recency_token: file.recency_token,
            meta_data: file.meta_data,
        } as const;
    }

    filter_by_meta_data(op: SBackendOperation<"FILTER_BY_META_DATA">) {
        const regex: [string, RegExp][] = [];
        try {
            Object.keys(op.filter_by).forEach((k: string) => {
                regex.push([k, new RegExp(op.filter_by[k]!)]);
            });
        } catch (e: any) {
            return `Invalid RegExp: ${e.message!}`;
        }

        return Object.values(this.Store).filter((f) => {
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
    }

    delete_by_meta_data(op: SBackendOperation<"DELETE_BY_META_DATA">) {
        const regex: [string, RegExp][] = [];
        try {
            Object.keys(op.delete_by).forEach((k: string) => {
                regex.push([k, new RegExp(op.delete_by[k]!)]);
            });
        } catch (e: any) {
            return `Invalid RegExp: ${e.message!}`;
        }

        const res: FileReference[] = [];
        for (let f of Object.values(this.Store)) {
            for (const [key, reg] of regex) {
                if (
                    typeof f.meta_data[key] === "undefined" ||
                    !reg.test(f.meta_data[key])
                ) {
                    continue;
                }
            }

            this.handle_file_event({
                type: "DELETE",
                file_reference: f.meta_data.fileReference
            });
            res.push(f.meta_data.fileReference);
            delete this.Store[f.meta_data.fileReference];
        }
        return res;
    }


    private events: {
        [key: Address.StringSerializedAddress]: BoundBackendFileEvent[]
    } = {};
    private subscriptions: Subscription[] = [];
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
        this.subscriptions = this.subscriptions.filter(sub => {
            return (
                sub.address.equals(addr)
                && sub.fr === op.fr
                && sub.key === op.key
            )
        });
        return null;
    }
    get_active_subscriptions(addr: Address, op: SBackendOperation<"GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE">): BackendActiveSubscriptionResult {
        const res: BackendActiveSubscriptionResult = [];
        this.subscriptions.forEach(s => {
            if (s.address.equals(addr)) {
                res.push({
                    key: s.key,
                    fr: s.fr
                });
            }
        });
        return res;
    }
    dispatch_file_events() {
        Object.entries(this.events).forEach(([a, fe]: [any, BoundBackendFileEvent[]]) => {
            const addr = Address.fromString(a);
            PluginMethods.trigger_file_events(
                addr, fe
            );
        });

        this.events = {}
    }
    handle_file_event(evt: BackendFileEvent) {
        for (let i = 0; i < this.subscriptions.length; i++) {
            const sub = this.subscriptions[i]!;

            if (sub.fr === evt.file_reference) {
                const entry = this.events[sub.address.toString()];
                if (entry) {
                    entry.push({
                        ...evt,
                        subscription_key: sub.key
                    })
                } else {
                    this.events[sub.address.toString()] = [{
                        ...evt,
                        subscription_key: sub.key
                    }]
                }
            }

            if (evt.type === "DELETE") {
                this.subscriptions.splice(i, 1);
                i--;
            }
        }
    }
}

export const liveStore = new LiveStore();
