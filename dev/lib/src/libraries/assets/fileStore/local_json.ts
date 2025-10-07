import { FileReference, FileStore, execute_atomic_transaction } from ".";
import { mapSuccessAsync } from "../../../utils/error_handling";
import { Json } from "../../../utils/exports";
import { JsonPatch } from "../../../utils/json";
import { LocalStringStore } from "./local_string";

export class LocalJsonStore<T extends Json> implements FileStore<T> {
    protected string_store = new LocalStringStore();

    async read(fr: FileReference) {
        return await mapSuccessAsync(
            this.string_store.read(fr),
            (r) => JSON.parse(r) as T
        );
    }
    async write(fr: FileReference, contents: T) {
        return await this.string_store.write(fr, JSON.stringify(contents));
    }
    async dump() {
        const res = this.string_store.dump();
        return Object.fromEntries(
            Object.entries(res).map(
                ([k, v]) => [k, JSON.parse(v) as T]
            )
        );
    }
    async delete(fr: FileReference) {
        return await this.string_store.delete(fr);
    }
    atomic(arg: (ctx: ReturnType<typeof this.atomic_context>) => Promise<void | Error | boolean>) {
        return execute_atomic_transaction(arg, this.atomic_context());
    }
    async files() {
        return await this.string_store.files()
    }
    async has_file(fr: FileReference) {
        return await this.string_store.has_file(fr)
    }
    async patch(fr: FileReference, op: JsonPatch.Operation[]) {
        return new Error("Unimplemented")
    }
    protected atomic_context(this: LocalJsonStore<T>) {
        const sctx = this.string_store.atomic_context();

        return {
            read: async (fr: FileReference) => {
                return JSON.parse(await sctx.read(fr));
            },
            write: async (fr: FileReference, contents: T) => {
                return await sctx.write(fr, JSON.stringify(contents));
            },
            delete: async (fr: FileReference) => {
                return await sctx.delete(fr);
            },
            files: async () => {
                return await sctx.files();
            },
            has_file: async (fr: FileReference) => {
                return await sctx.has_file(fr);
            },
            patch: async (fr: FileReference) => {
                throw new Error("Unimplemented");
            },
            rollback: () => { return sctx.rollback() },
            __commit: async () => {
                return await sctx.__commit();
            },
            __rollback: () => sctx.__rollback(),
            store: this
        }
    }
}
