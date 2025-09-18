import { Effect } from "effect";
import { AbstractLibraryImplementation } from "../../../../../lib/src/pluginSystem/library/library_implementation";
import { CallbackError } from "../../../../../lib/src/utils/exports";
import { getQuickJS, QuickJSContext, Scope } from "quickjs-emscripten";
import { expose_partial } from "./expose";

const QuickJS = getQuickJS();

export const createJSWASMLibraryEffect = Effect.fn("createJSWASMLibrary")(
    function* (code: string) {
        const qjs = yield* Effect.tryPromise({
            try: () => QuickJS,
            catch: (e) => new Error("Failed to load QuickJS")
        });

        const scope = new Scope();

        try {
            const runtime = scope.manage(qjs.newRuntime());
            runtime.setModuleLoader((r) => r === "__everything__" ? code : "")

            runtime.setMemoryLimit(1024 * 640)
            runtime.setMaxStackSize(1024 * 320)

            const context = scope.manage(runtime.newContext());
            yield* exposeGlobals(context);

            const base_code = `
                import * as Everything from "__everything__"
                for (const key in Everything) {
                    if (typeof Everything[key] === "function") {
                        globalThis[key] = Everything[key]
                    }
                }
                export default Object.keys(Everything)
              `

            const result = context.evalCode(
                base_code,
                "lib.js",
                { type: "module" },
            )

            const moduleExports = context.unwrapResult(result)
            const res = context.dump(moduleExports);
            moduleExports.dispose()

            return AbstractLibraryImplementation.from_methods(
                () => res.default,
                (fn, args) => {
                    if (!res.default.includes(fn)) {
                        throw new Error("Function not found");
                    }

                    try {
                        const ev = context.evalCode(
                            `JSON.stringify(globalThis[${JSON.stringify(fn)}](${args.map(a => JSON.stringify(a)).join(",")}))`
                        );

                        const r = context.unwrapResult(ev);
                        const value = context.getString(r);
                        r.dispose();
                        return JSON.parse(value);
                    }
                    catch (e) {
                        throw new Error("Failed to evaluate function > " + e);
                    }
                },
                scope.dispose
            );
        } catch (e) {
            scope.dispose();
            return yield* Effect.fail(new CallbackError(
                e as Error
            ));
        }
    }
)

const exposeGlobals = Effect.fn("exposeGlobals")(
    function* (context: QuickJSContext) {
        expose_partial(
            context,
            "console",
            [
                "log",
                "error",
            ],
            console
        );
    });

export const createJSWASMLibrary = (code: string) => createJSWASMLibraryEffect(code).pipe(
    Effect.merge,
    Effect.runPromise
);
