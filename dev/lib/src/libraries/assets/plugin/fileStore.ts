import { Json } from "../../../utils/json";
import { LocalJsonStore } from "../fileStore/local_json";
import { File, FileDescription, FileReference, MetaData } from "../types";

export class LocalFileStore extends LocalJsonStore<File> {
    protected descriptions: {
        [key: FileReference]: FileDescription
    } = {};

    protected atomic_context(this: LocalFileStore) {
        const sctx = this.string_store.atomic_context();

        return {
            read: async (fr: FileReference) => {
                return JSON.parse(await sctx.read(fr));
            },
            write: async (fr: FileReference, contents: File) => {
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

            filter_by_meta_data(filter_by: {
                [key: string]: string
            }) { throw new Error("Unimplemented") },
            write_contents(fr: FileReference, contents: Json) {
                throw new Error("Implement via json patch")
            },
            write_meta_data(fr: FileReference, contents: Json) {
                throw new Error("Implement via json patch")
            },
            delete_by_meta_data(filter_by: {
                [key: string]: string
            }) {
                throw new Error("Not implemented")
            },

            store: this,
        }
    }
}
