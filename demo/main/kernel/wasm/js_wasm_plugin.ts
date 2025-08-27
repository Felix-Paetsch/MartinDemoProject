import { Effect } from "effect";
import { Address } from "pc-messaging-kernel/messaging";
import { Initialization, MessageChannel } from "pc-messaging-kernel/pluginSystem/common";
import { KernelEnvironment, PluginReference } from "pc-messaging-kernel/pluginSystem/kernel";
import { PluginIdent, PluginIdentWithInstanceId } from "pc-messaging-kernel/pluginSystem/plugin";
import { callbackAsEffect, Json } from "pc-messaging-kernel/utils";
import { newQuickJSAsyncWASMModule } from "quickjs-emscripten";

const baseCode = `
// import init from "#init#";
import plugin from "#";
console.log("A");
console.log("B");
console.log("C");
// init(plugin);
`

const WASM_Module = newQuickJSAsyncWASMModule();
export const createJSWASMPlugin = Effect.fn("createJSWASMPlugin")(
    function* (k: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId, pluginAddress: Address) {
        const module = yield* Effect.tryPromise({
            try: () => WASM_Module,
            catch: (e) => new Error("Failed to load WASM module")
        })

        const runtime = module.newRuntime()
        runtime.setMemoryLimit(1024 * 640)
        runtime.setMaxStackSize(1024 * 320)
        let interruptCycles = 0
        runtime.setInterruptHandler(() => ++interruptCycles > 1024)
        runtime.setModuleLoader(async (modulePath) => {
            const url = new URL(modulePath);
            return await fetch(url).then((res) => res.text());
        }, (baseModuleName, requestedName) => {
            console.log("WANNA REQUEST", requestedName, baseModuleName);

            if (requestedName === "#") {
                const currentFileUrl = new URL(import.meta.url);
                const entry_path = new URL(`/src/demos/website/core/wasm_plugins/${plugin_ident.name}/index`, currentFileUrl);
                return entry_path.href;
            } else if (requestedName === "#init#") {
                const currentFileUrl = new URL(import.meta.url);
                const entry_path = new URL(`/src/demos/website/core/kernel/wasm/base`, currentFileUrl);
                return entry_path.href;
            }
            return new URL(requestedName, new URL(baseModuleName)).href;
        });


        const context = runtime.newContext();
        const sendHandle = context.newFunction("_send_message", (arg_0) => {
            const nativeArg: unknown = context.dump(arg_0);
            console.log("Recieved msg: ", nativeArg);
        });
        context.setProp(context.global, "_send_message", sendHandle);

        let cb: (data: Json) => void = (data: Json) => {
            console.log("Recieved QuickJS msg: ", data);
        };
        const logHandle = context.newFunction("log", (...args) => {
            const nativeArg = args.map(context.dump)
            cb(nativeArg);
        })
        const consoleHandle = context.newObject()
        context.setProp(consoleHandle, "log", logHandle)
        context.setProp(context.global, "console", consoleHandle)
        consoleHandle.dispose()
        logHandle.dispose()

        yield* Effect.tryPromise({
            try: () => context.evalCodeAsync(baseCode),
            catch: (e) => new Error("Failed to evaluate base code")
        });

        /* new stuff */
        const c: MessageChannel = {
            send: (msg) => {
                console.log("SENDING MSG", msg);
                context.evalCode(`globalThis._send_message(JSON.parse('${JSON.stringify(msg).replaceAll("'", "\\'")
                    }'))`);
            },
            recieve: (_cb) => { cb = _cb; }
        };

        const {
            execute,
            remove
        } = yield* Initialization.kernel(c, k.address, pluginAddress, plugin_ident);

        const plugin_reference = new PluginReference(
            pluginAddress,
            plugin_ident,
            k,
            async () => {
                await remove();
            }
        );
        k.register_plugin_middleware(plugin_reference);

        yield* callbackAsEffect(execute)();
        return plugin_reference;
    })

export const isJSWASMPlugin = (plugin_ident: PluginIdent) => Effect.async<boolean>((resume) => {
    const name = plugin_ident.name.toLowerCase();
    // /src/demos/website/core/..
    const potential_path = `/src/demos/website/core/wasm_plugins/${name}/index.ts`;

    fetch(potential_path).then(
        r => {
            const content_type = r.headers.get("content-type") || "error";
            resume(Effect.succeed(r.ok && (
                content_type == "text/js"
                || content_type == "text/javascript"
            )));
        }
    ).catch(e => resume(Effect.succeed(false)));
}).pipe(Effect.withSpan("testIsJSWASMPlugin"))