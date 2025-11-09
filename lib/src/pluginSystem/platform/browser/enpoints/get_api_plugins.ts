import fs from "fs";
import path from "path";
import { PluginsApiData } from "../../server/api";
export function get_external_endpoints(): string[] {
    const filePath = path.join(process.cwd(), "plugins", "external.json");

    if (!fs.existsSync(filePath)) {
        return [];
    }

    try {
        const fileData = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(fileData);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function api_endpoints_get_api_plugins(): Promise<PluginsApiData> {
    const external_endpoints = get_external_endpoints();

    const fetches: Promise<PluginsApiData | undefined>[] = external_endpoints.map(
        async (url) => {
            try {
                const res = await fetch(url, { method: "POST" });
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data)) {
                    return data as PluginsApiData;
                }
            } catch {
                return;
            }
        }
    );

    const promise_results = await Promise.all(fetches);
    const results = promise_results.filter(Boolean) as PluginsApiData[];
    return results.flat();
}
