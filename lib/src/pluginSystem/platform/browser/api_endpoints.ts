import { Json } from "../../../utils/exports";
import { api_endpoints_get_local_plugins } from "./enpoints/get_local_plugins";
import { api_endpoints_get_api_plugins } from "./enpoints/get_api_plugins";

let api_endpoint = "http://localhost:3001/";
export function set_api_endpoint_path(path: string) {
    api_endpoint = path.endsWith("/") ? path : path + "/";
}

export const api_endpoints = {
    local_plugins: api_endpoints_get_local_plugins,
    get_api_plugins: api_endpoints_get_api_plugins
} as const;

export type ApiResponse<S extends Json | Error> = Promise<{
    error: true,
    value: string
} | {
    error: false,
    value: Exclude<Awaited<S>, Error>
}>

export type EndpointArgs<K extends keyof typeof api_endpoints> =
    Parameters<(typeof api_endpoints)[K]>;
export type EndpointReturn<K extends keyof typeof api_endpoints> =
    Awaited<ReturnType<(typeof api_endpoints)[K]>>;

export async function get_api_data<K extends keyof typeof api_endpoints>(
    key: K,
    ...args: EndpointArgs<K>
): Promise<EndpointReturn<K> | Error> {
    const res = await fetch(api_endpoint + key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args)
    }).catch((e) => e as Error);

    if (res instanceof Error) {
        return res;
    }
    if (!res.ok) {
        return new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const res2 = (
        await res.json().catch(e => e as Error)
    ) as Error | Awaited<
        ApiResponse<
            EndpointReturn<K>
        >
    >;

    if (res2 instanceof Error) return res2;
    if (res2.error) {
        return new Error(res2.value);
    }

    return res2.value;
}

export async function compute_api_data(key: string, args: Json[]): ApiResponse<Json> {
    if (!Object.keys(api_endpoints).includes(key)) {
        return {
            error: true,
            value: `API Endpoint: ${key} not found`
        }
    }

    try {
        const res = await (api_endpoints as any)[key](...(args as any[]));
        if (res instanceof Error) throw res;
        return {
            value: res,
            error: false,
        }
    } catch (e) {
        return {
            error: true,
            value: (e as Error).name
        }
    }
}

// export async function compute_api_data<K extends keyof typeof api_endpoints>(
//     key: K, args: EndpointArgs<K>): ApiResponse<
//         Awaited<ReturnType<typeof api_endpoints[K]>>
//     > {
//     const res: Awaited<Error | ReturnType<typeof api_endpoints[K]>> = await (api_endpoints[key] as any)(...args);
//
//     if (res instanceof Error) {
//         return {
//             error: true,
//             value: res.name
//         }
//     }
//
//     return {
//         error: false,
//         value: res as any
//     }
// }
