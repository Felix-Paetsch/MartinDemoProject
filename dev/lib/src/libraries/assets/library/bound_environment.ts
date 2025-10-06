import { PluginEnvironment, uuidv4 } from "../../../pluginSystem/plugin_exports";
import { FileContents, FileReference, RecencyToken } from "../types";
import { JsonPatch } from "../../../utils/json-patch";
import {
    subscribe,
    unsubscribe,
    write,
    create,
    read,
    delete_file,
    file,
    force_write,
    patch,
    set_meta_data,
    active_subscriptions,
    delete_by_meta_data,
    filter_by_meta_data,
    force_set_meta_data,
    update_meta_data,
    RegexString,
    atomic_operation,
    bundled_operation,
    description,
    meta_data
} from "."
import { SubscriptionCallback } from "./subscriptions";
import { ClientSideOperation } from "../operations";

export class AssetManager {
    constructor(readonly env: PluginEnvironment) { }

    create(fr: FileReference = uuidv4(), meta_data: { [key: string]: string } = {}, contents: FileContents = "") {
        return create(this.env, fr, meta_data, contents);
    }
    delete(fr: FileReference) {
        return delete_file(this.env, fr)
    }
    delete_file(fr: FileReference) {
        return delete_file(this.env, fr)
    }
    read(fr: FileReference) {
        return read(this.env, fr);
    }
    file(fr: FileReference) {
        return file(this.env, fr);
    }
    description(fr: FileReference) {
        return description(this.env, fr);
    }
    meta_data(fr: FileReference) {
        return meta_data(this.env, fr);
    }

    subscribe(to: FileReference, callback: SubscriptionCallback, key: string = uuidv4()) {
        return subscribe(this.env, to, callback, key);
    }
    unsubscribe(fr: FileReference, key: string) {
        return unsubscribe(this.env, fr, key);
    }
    active_subscriptions(fr: FileReference) {
        return active_subscriptions(this.env, fr);
    }

    write(fr: FileReference, token: RecencyToken, contents: FileContents) {
        return write(this.env, fr, token, contents);
    }

    force_write(fr: FileReference, contents: FileContents) {
        return force_write(this.env, fr, contents);
    }
    patch(fr: FileReference, token: RecencyToken, patches: JsonPatch.Operation[]) {
        return patch(this.env, fr, token, patches);
    }

    set_meta_data(
        fr: FileReference,
        recency_token: RecencyToken,
        data: { [key: string]: string }
    ) {
        return set_meta_data(this.env, fr, recency_token, data)
    }

    force_set_meta_data(
        fr: FileReference,
        data: { [key: string]: string }
    ) {
        return force_set_meta_data(this.env, fr, data)
    }

    update_meta_data(
        fr: FileReference,
        recency_token: RecencyToken,
        data: { [key: string]: string }
    ) {
        return update_meta_data(this.env, fr, recency_token, data)
    }

    filter_by_meta_data(
        data: { [key: string]: RegexString }
    ) {
        return filter_by_meta_data(this.env, data);
    }

    delete_by_meta_data(
        data: { [key: string]: RegexString }
    ) {
        return delete_by_meta_data(this.env, data);
    }

    atomic(operations: ClientSideOperation[]) {
        return atomic_operation(this.env, operations);
    }

    bundled(operations: ClientSideOperation[]) {
        return bundled_operation(this.env, operations);
    }
}
