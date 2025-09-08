import { QuickJSContext } from "quickjs-emscripten";
import { create_handle } from "./handle";

type ExposePartialObjectDescription = (string | [string, ExposePartialObjectDescription])[]
export function expose_partial(
    context: QuickJSContext,
    name: string,
    what: ExposePartialObjectDescription,
    object: any
) {
    const res = build_partial_object(what, object);
    expose(context, name, res);
}

function build_partial_object(
    what: ExposePartialObjectDescription,
    object: any
) {
    const res: Record<string, any> = {};

    for (const entry of what) {
        if (typeof entry === "string") {
            res[entry] = object[entry];
        } else {
            const [key, value] = entry;
            res[key] = build_partial_object(value, object[key]);
        }
    }

    return res;
}

/* ============================================== */

export default function expose(
    context: QuickJSContext,
    name: string,
    object: any
) {
    const handle = create_handle(context, object);
    context.setProp(
        context.global,
        name,
        handle
    );
    handle.dispose();
}