import variant from "@jitl/quickjs-singlefile-mjs-debug-sync";
import { Effect } from "effect";
import { Address } from "pc-messaging-kernel/messaging";
import { Initialization, MessageChannel } from "pc-messaging-kernel/pluginSystem/common";
import { KernelEnvironment, PluginReference } from "pc-messaging-kernel/pluginSystem/kernel";
import { PluginIdent, PluginIdentWithInstanceId } from "pc-messaging-kernel/pluginSystem/plugin";
import { callbackAsEffect, Json } from "pc-messaging-kernel/utils";
import { newQuickJSWASMModule, setDebugMode } from "quickjs-emscripten";

setDebugMode(true);
const QuickJS = newQuickJSWASMModule(variant);
export const createJSWASMPlugin = Effect.fn("createJSWASMPlugin")(
    function* (k: KernelEnvironment, plugin_ident: PluginIdentWithInstanceId, pluginAddress: Address) {
        // Already this gives an error!!
        const module = yield* Effect.tryPromise({
            try: () => QuickJS,
            catch: (e) => new Error("Failed to load QuickJS")
        }).pipe(
            Effect.tapError(e => {
                console.log("ERROR", e);
                return Effect.succeed(e);
            })
        );
        const pluginCode = yield* Effect.tryPromise({
            try: () => fetch(`http://localhost:5174/${plugin_ident.name}.js`).then(r => r.text()),
            catch: (e) => new Error("Failed to load plugin code")
        });
        const runtime = module.newRuntime()
        runtime.setMemoryLimit(1024 * 640)
        runtime.setMaxStackSize(1024 * 320)
        let interruptCycles = 0
        runtime.setInterruptHandler(() => {
            ++interruptCycles;
            if (interruptCycles > 1024) console.log("INTERRUPT");
            return interruptCycles > 1024;
        })

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

        console.log("We are now running");
        const result = yield* Effect.try({
            try: () => context.evalCode("console.log('hi');" + pluginCode),
            catch: (e) => new Error("Failed to evaluate base code")
        });

        if (result.error) {
            try {
                console.log(context.unwrapResult(result));
            } catch (e) {
                console.log("ERROR", e);
            }
        } else {
            console.log("no error");
        }
        const result2 = context.unwrapResult(result);
        console.log("MID");
        const result3 = context.dump(result2);
        console.log("THE RESULT2", result3);
        /* new stuff */
        const c: MessageChannel = {
            send: (msg) => {
                console.log("SENDING MSG", msg);
                context.evalCode(`globalThis._send_message(JSON.parse('${JSON.stringify(msg).replaceAll("'", "\\'")
                    }'))`);
            },
            recieve: (_cb) => { cb = _cb; }
        };
        console.log("YAY");
        const {
            execute,
            remove
        } = yield* Initialization.kernel(c, k.address, pluginAddress, plugin_ident);
        console.log("NAY");
        const plugin_reference = new PluginReference(
            pluginAddress,
            plugin_ident,
            k,
            async () => {
                await remove();
            }
        );
        k.register_plugin_middleware(plugin_reference);
        console.log("HHHHHHH");
        yield* callbackAsEffect(execute)();
        console.log("IIIIIII");
        return plugin_reference;
    })

export const isJSWASMPlugin = (plugin_ident: PluginIdent) => Effect.async<boolean>((resume) => {
    const name = plugin_ident.name.toLowerCase();
    // /src/demos/website/core/..
    const potential_path = `http://localhost:5174/${name}.js`;

    fetch(potential_path).then(
        r => {
            resume(Effect.succeed(r.ok));
        }
    ).catch(e => resume(Effect.succeed(false)));
}).pipe(Effect.withSpan("testIsJSWASMPlugin"))