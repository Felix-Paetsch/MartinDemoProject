import { FileContents, FileDescription, FileReference, RecencyToken } from "../types/base";
import { AssetManager } from "./asset_manager";
import { JsonPatch, mapSuccessAsync, uuidv4 } from "pc-messaging-kernel/utils";
import { create, subscribe } from "./base_methods";
import { FileEvent, SubscriptionCallback } from "../types/frontend_file_events";
import { PluginEnvironment } from "pc-messaging-kernel/pluginSystem";

class ManagedFile {
    private _deleted = false;
    private AssetManager: AssetManager;
    private _token: RecencyToken = "";
    private subscriptions: {
        key: string,
        cb: SubscriptionCallback,
    }[] = [];

    constructor(
        readonly env: PluginEnvironment,
        readonly fr: FileReference,
        on_event: (cb: SubscriptionCallback) => void,
        readonly subscription_key: string
    ) {
        this.AssetManager = new AssetManager(env);
        on_event(this.#callback.bind(this));
    }

    get recency_token() {
        return this._token;
    }

    get is_deleted() {
        return this._deleted;
    }

    async #callback(event: FileEvent) {
        if (event.type === "DELETE") {
            this._deleted = true;
        } else {
            this._token = event.recency_token
        }
        this.subscriptions.forEach(s => s.cb(event));
    }

    async file() {
        const f = await this.AssetManager.read_file(this.fr);
        if (f instanceof Error) return f;
        this._token = f.recency_token;
        return f;
    }
    description() {
        return mapSuccessAsync(
            this.AssetManager.description(this.fr),
            (r) => {
                this._token = r.recency_token;
                return r
            }
        );
    }
    set_meta_data(data: { [key: string]: string }) {
        return mapSuccessAsync(
            this.AssetManager.set_meta_data(
                this.fr, this.recency_token, data
            ), (r) => {
                this._token = r.recency_token
            }
        )
    }
    force_set_meta_data(data: { [key: string]: string }) {
        return mapSuccessAsync(
            this.AssetManager.force_set_meta_data(
                this.fr, data
            ), (r) => {
                this._token = r.recency_token
            })
    }
    update_meta_data(data: { [key: string]: string }) {
        return mapSuccessAsync(
            this.AssetManager.update_meta_data(
                this.fr, this.recency_token, data
            ), (r) => {
                this._token = r.recency_token
            })
    }

    delete() {
        return this.AssetManager.delete_file(this.fr);
    }
    async active_subscriptions() {
        return this.subscriptions.map(s => s.key);
    }

    write(contents: FileContents) {
        return mapSuccessAsync(
            this.AssetManager.write(
                this.fr, this.recency_token, contents
            ),
            (a: FileDescription) => {
                this._token = a.recency_token;
                return a;
            }
        );
    }
    force_write(contents: FileContents) {
        return mapSuccessAsync(
            this.AssetManager.force_write(this.fr, contents),
            (a: FileDescription) => {
                this._token = a.recency_token;
                return a;
            }
        );
    }
    patch(patches: JsonPatch.Operation[]) {
        return mapSuccessAsync(
            this.AssetManager.patch(this.fr, this.recency_token, patches),
            (a: FileDescription) => {
                this._token = a.recency_token;
                return a;
            }
        );
    }

    subscribe(callback: SubscriptionCallback, key: string = uuidv4()) {
        this.subscriptions.push({
            key,
            cb: callback
        })
        return key;
    }

    unsubscribe(key: string) {
        if (key === "all") {
            this.subscriptions = [];
        } else {
            this.subscriptions = this.subscriptions.filter(s => {
                return s.key === key;
            });
        };
    }
}

export type ManagedFileType = ManagedFile;

export async function manage_file(env: PluginEnvironment, fr: FileReference) {
    let on_msg: SubscriptionCallback = async () => { };
    const r = await subscribe(env, fr, (event: FileEvent) => {
        return on_msg(event);
    });
    if (r instanceof Error) return r;
    return new ManagedFile(
        env,
        fr,
        (cb: SubscriptionCallback) => { on_msg = cb; },
        r.key
    )
}

export async function create_managed_file(env: PluginEnvironment, fr: FileReference = uuidv4()) {
    const created = await create(env, fr);
    if (created instanceof Error) return created;
    return await manage_file(env, fr);
}
