import { FileReference, FileStore, AtomicContext, execute_atomic_transaction } from ".";

export class LocalStringStore implements FileStore<string> {
    protected _files: { [key: FileReference]: string } = {};
    constructor() { }
    async read(fr: FileReference) {
        const file = this._files[fr];

        if (typeof file === "undefined") return new Error("File not found");
        return file;
    }
    async write(fr: FileReference, contents: string) {
        this._files[fr] = contents;
    }
    async dump(): Promise<{ [key: FileReference]: string }> {
        return JSON.parse(JSON.stringify(this._files));
    }
    async delete(fr: FileReference) {
        delete this._files[fr];
    }
    atomic(arg: (ctx: AtomicContext<string>) => Promise<void | Error | boolean>) {
        return execute_atomic_transaction(arg, this.atomic_context());
    }
    async files() {
        return Object.keys(this._files);
    }
    async has_file(fr: FileReference) {
        return typeof this._files[fr] !== "undefined"
    }

    atomic_context(): AtomicContext<string> & {
        __commit: () => Promise<void>,
        __rollback: () => Promise<void>
    } {
        const mirror: { [key: string]: string } = {};
        let deleted_files: string[] = [];

        const commits: (() => void)[] = [];
        // have a systems file file store
        // for the library: keep all meta_data in mind
        // the file store we will use also has a dump method (or dump meta_data)
        // file stores can also have a shape of the files they store
        return {
            read: async (fr) => {
                if (typeof mirror[fr] !== "undefined") return mirror[fr];
                return await this.read(fr).then(r => this.#throw_on_error(r))
            },
            write: async (fr, contents) => {
                mirror[fr] = contents;
                deleted_files = deleted_files.filter(f => f !== fr);
                commits.push(() => this._files[fr] = contents)
            },
            delete: async (fr) => {
                delete mirror[fr];
                deleted_files.push(fr);
                commits.push(() => {
                    delete this._files[fr];
                })
            },
            files: async () => {
                let files = this.#throw_on_error(await this.files());
                for (let f of Object.keys(mirror)) {
                    if (!files.includes(f)) {
                        files.push(f);
                    }
                }

                return files.filter(f => !deleted_files.includes(f));
            },
            has_file: async (fr) => {
                if (deleted_files.includes(fr)) return false;
                return await this.has_file(fr).then(r => this.#throw_on_error(r))
            },
            rollback: () => { throw new Error("Triggered rollback") },
            __commit: async () => {
                commits.forEach(c => c());
            },
            __rollback: () => Promise.resolve(),
            store: this
        }
    }

    #throw_on_error<T>(a: T) {
        if (a instanceof Error) throw a;
        return a as Exclude<T, Error>
    }
}
