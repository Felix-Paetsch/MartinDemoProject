import { Address } from "../../messaging/exports";
import { Json } from "../../utils/exports";
import { PluginEnvironment } from "../../pluginSystem/plugin_exports";
import Library from "./library";

type local_method<Args extends Json[]> = (
    add: Address,
    ...args: Args
) => Json | Error | Promise<Json | Error>;

type plugin_method<Args extends Json[]> = (
    env: PluginEnvironment,
    ...args: Args
) => Json | Error | Promise<Json | Error>;

// Helper type: extract args *after* first two parameters safely
type TailArgs<T> = T extends [any, ...infer ARGS]
    ? ARGS extends [] // ensure even [] is preserved
    ? []
    : ARGS
    : [];

export class RecordLibrary<
    L extends Record<string, local_method<any>>,
    P extends Record<string, plugin_method<any>>
> extends Library {
    constructor(
        private LocalMethods: L,
        private PluginMethods: P,
        name: string
    ) {
        super(name);
    }

    evalue_library_method(
        address: Address,
        name: string,
        ...args: Json[]
    ): Json | Error | Promise<Json | Error> {
        const method = this.LocalMethods[name];
        if (!method) {
            return new Error("Method '" + method + "' not found");
        }

        return method(address, ...args);
    }

    evalue_plugin_method(
        env: PluginEnvironment,
        name: string,
        ...args: Json[]
    ): Json | Error | Promise<Json | Error> {
        const method = this.PluginMethods[name];
        if (!method) {
            return new Error("Method '" + method + "' not found");
        }

        return method(env, ...args);
    }

    library_methods_record(): {
        [K in keyof L]: (
            env: PluginEnvironment,
            ...args: TailArgs<Parameters<L[K]>>
        ) => Promise<Error | Awaited<ReturnType<L[K]>>>;
    } {
        const res = {} as {
            [K in keyof L]: (
                env: PluginEnvironment,
                ...args: TailArgs<Parameters<L[K]>>
            ) => Promise<Awaited<ReturnType<L[K]>>>;
        };

        for (const k of Object.keys(this.LocalMethods) as Array<keyof L>) {
            res[k] = ((env: PluginEnvironment, ...args: any[]) => {
                return this.call_library_method(env, k as any, ...args);
            }) as any;
        }

        return res;
    }

    plugin_methods_record(): {
        [K in keyof P]: (
            address: Address,
            ...args: TailArgs<Parameters<P[K]>>
        ) => Promise<Error | Awaited<ReturnType<P[K]>>>;
    } {
        const res = {} as {
            [K in keyof P]: (
                address: Address,
                ...args: TailArgs<Parameters<P[K]>>
            ) => Promise<Error | Awaited<ReturnType<P[K]>>>;
        };

        for (const k of Object.keys(this.PluginMethods) as Array<keyof P>) {
            res[k] = ((address: Address, ...args: any[]) =>
                this.call_plugin_method(address, k as any, ...args)) as any;
        }

        return res;
    }
}
