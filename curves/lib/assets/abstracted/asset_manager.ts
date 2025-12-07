import { uuidv4, JsonPatch } from "pc-messaging-kernel/utils";
import { FileContents, FileReference, RecencyToken, RegexString } from "../types/base";
import { active_subscriptions, atomic, batch, create, delete_by_meta_data, delete_file, description, filter_by_meta_data, force_set_meta_data, force_write, patch, read_file, set_meta_data, subscribe, unsubscribe, update_meta_data, write } from "./base_methods";
import { FrontendOperation } from "../library";
import { SubscriptionCallback } from "../exports";
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";


export class AssetManager {
    constructor(readonly env: PluginEnvironment) { }

    create(fr: FileReference, meta_data: { [key: string]: string } = {}, contents: FileContents = "") {
        return create(this.env, fr, meta_data, contents);
    }
    delete_file(fr: FileReference) {
        return delete_file(this.env, fr)
    }
    read_file(fr: FileReference) {
        return read_file(this.env, fr);
    }
    description(fr: FileReference) {
        return description(this.env, fr);
    }
    subscribe(to: FileReference, callback: SubscriptionCallback, key: string = uuidv4()) {
        return subscribe(this.env, to, callback, key);
    }
    unsubscribe(fr: FileReference, key: string) {
        return unsubscribe(this.env, fr, key);
    }
    active_subscriptions() {
        return active_subscriptions(this.env);
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

    atomic(operations: FrontendOperation[]) {
        return atomic(this.env, operations);
    }

    batch(operations: FrontendOperation[]) {
        return batch(this.env, operations);
    }
}
