import { QuickJSContext, QuickJSHandle, Scope } from "quickjs-emscripten";

export function create_handle(context: QuickJSContext, object: any): QuickJSHandle {
    if (is_basic_type(object)) {
        return create_basic_type_handle(context, object);
    }

    if (typeof object === "function") {
        if (is_class(object)) {
            throw new Error("Classes are not supported");
        }
        return create_function_handle(context, object);
    }

    if (object instanceof Promise) {
        return create_promise_handle(context, object);
    }

    if (typeof object === "object") {
        return create_object_handle(context, object);
    }

    throw new Error("Forgot a case");
}

/* ============================================== */

function create_promise_handle(context: QuickJSContext, promise: Promise<any>): QuickJSHandle {
    const np: Promise<QuickJSHandle> = promise.then(res => {
        const h = create_handle(context, res);
        return h;
    });
    return context.newPromise(np).handle;
}

/* ============================================== */

function create_function_handle(context: QuickJSContext, fn: (...args: any[]) => any) {
    return context.newFunction(fn.name, (...args) => {
        const nativeArgs = args.map(context.dump)
        const res = fn(...nativeArgs);
        return create_handle(context, res);
    });
}

/* ============================================== */

function is_basic_type(object: any) {
    return typeof object === "string"
        || typeof object === "number"
        || typeof object === "boolean"
        || object === null
        || object === undefined
}

function create_basic_type_handle(context: QuickJSContext, object: any) {
    if (typeof object === "string") {
        return context.newString(object)
    }
    if (typeof object === "number") {
        return context.newNumber(object)
    }

    const serialization = {
        null: "null",
        undefined: "undefined",
        true: "true",
        false: "false",
    }

    if (!serialization[object as keyof typeof serialization]) {
        throw new Error("Invalid basic type")
    }

    return from_evaluated(context, serialization[object as keyof typeof serialization])
}

/* ============================================== */

function from_evaluated(context: QuickJSContext, s: string): QuickJSHandle {
    const r = context.evalCode(s);
    if (r.error) {
        r.error.dispose();
        throw new Error("Error evaluating code");
    }
    return r.value;
}

/* ============================================= */

function create_object_handle(context: QuickJSContext, object: any) {
    const obj_handle = context.newObject();

    const scope = new Scope();
    for (const key of get_all_properties(object) as (keyof object)[]) {
        const handle = scope.manage(create_function_handle(context, object[key]));
        context.setProp(obj_handle, key, handle);
    }

    scope.dispose();
    return obj_handle;
}

function get_all_properties(obj: {}) {
    const names = new Set<string>();
    const base = new Set(Object.getOwnPropertyNames(Object.prototype));

    while (obj && obj !== Object.prototype) {
        for (const name of Object.getOwnPropertyNames(obj)) {
            if (name === "constructor") continue;
            if (!base.has(name)) {
                names.add(name);
            }
        }
        obj = Object.getPrototypeOf(obj);
    }

    return [...names];
}

function is_class(object: any) {
    return (
        typeof object === "function" &&
        /^class\s/.test(Function.prototype.toString.call(object))
    );
}