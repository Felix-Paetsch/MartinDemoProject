import { Json } from "../../../utils/exports";

export type FileReference = string;

export interface AtomicContext<File extends Json> {
    read(fr: FileReference): Promise<File>;
    write(fr: FileReference, contents: File): Promise<void>;
    delete(fr: FileReference): Promise<void>;
    files(): Promise<FileReference[]>
    has_file(fr: FileReference): Promise<boolean>;
    rollback(): Promise<void>;
    store: FileStore<File>;
}

export interface FileStore<File extends Json> {
    read(fr: FileReference): Promise<File | Error>;
    write(fr: FileReference, contents: File): Promise<void | Error>;
    delete(fr: FileReference): Promise<void | Error>;
    atomic(arg: (ctx: AtomicContext<File>) => Promise<void | Error | boolean>): Promise<Error | void>;
    files(): Promise<Error | FileReference[]>;
    has_file(fr: FileReference): Promise<boolean>;
}

export async function execute_atomic_transaction<T extends Json, CTX extends AtomicContext<T> & {
    __commit: () => Promise<void>,
    __rollback: () => Promise<void>
}
>(
    arg: (ctx: CTX) => Promise<void | Error | boolean>,
    ctx: CTX
) {
    try {
        const res = await arg(ctx);
        if (res instanceof Error) {
            await ctx.__rollback();
            return res;
        }
        if (res === false) {
            await ctx.__rollback();
            return new Error("Operation failed");
        }
        await ctx.__commit();
    } catch (e: any) {
        await ctx.__rollback();
        return e as Error;
    }
}
