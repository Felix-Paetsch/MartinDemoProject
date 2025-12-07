import fs from "fs";
import url from "url";
import path from "path";
import { mapBothAsync, mapSuccessAsync } from "../../../utils/exports";
import { Plugin } from "../../../pluginSystem/exports";
import { ExecutablePlugin } from "../../types";

export interface NodeLocalPluginData {
    full_path: string,
    ext: ".ts" | ".js"
}

async function exists(p: string): Promise<boolean> {
    try {
        await fs.promises.access(p);
        return true;
    } catch {
        return false;
    }
}

async function loadPlugin(full_path: NodeLocalPluginData["full_path"]) {
    const fileUrl = url.pathToFileURL(full_path).href;
    return mapBothAsync(
        import(fileUrl).catch((r) => r as Error),
        (m) => m.default as Plugin,
        (e) => e as Error
    );
}

async function findLocalPlugins(): Promise<
    Record<string, NodeLocalPluginData>
> {
    const projectRoot = process.cwd();
    const targetRoot = path.resolve(projectRoot, "plugins", "local");
    const results: Record<string, NodeLocalPluginData> = {};

    async function walk(dir: string): Promise<void> {
        // @ts-ignore
        let entries: fs.Dirent[];
        try {
            entries = await fs.promises.readdir(dir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const subdir = path.join(dir, entry.name);
            const tsIndex = path.join(subdir, "index.ts");
            const jsIndex = path.join(subdir, "index.js");

            const hasTs = await exists(tsIndex);
            const hasJs = await exists(jsIndex);

            if (hasTs || hasJs) {
                const full_path = hasTs ? tsIndex : jsIndex;
                const ext = hasTs ? ".ts" : ".js";

                results[entry.name] = {
                    full_path,
                    ext
                };
            }

            await walk(subdir);
        }
    }

    try {
        await fs.promises.access(targetRoot);
        await walk(targetRoot);
    } catch {
        console.warn(`Directory not found: ${targetRoot}`);
    }

    return results;
}

async function findRootPlugin(): Promise<NodeLocalPluginData | null> {
    const projectRoot = process.cwd();
    const rootDir = path.resolve(projectRoot, "plugins", "root");
    const tsIndex = path.join(rootDir, "index.ts");
    const jsIndex = path.join(rootDir, "index.js");

    const hasTs = await exists(tsIndex);
    const hasJs = await exists(jsIndex);

    if (!hasTs && !hasJs) {
        return null;
    }

    const full_path = hasTs ? tsIndex : jsIndex;
    const ext = hasTs ? ".ts" : ".js";

    return {
        full_path,
        ext
    };
}

export async function getLocalPlugins(): Promise<
    Record<string, ExecutablePlugin>
> {
    const [localPlugins, rp] = await Promise.all([
        findLocalPlugins(),
        findRootPlugin(),
    ]);

    if (rp) {
        localPlugins["root"] = rp;
    }

    const res: Record<string, ExecutablePlugin> = {};
    for (const [key, data] of Object.entries(localPlugins)) {
        res[key] = {
            plugin_descr: {
                type: "local",
                name: key
            },
            execute: (k, ident) => mapSuccessAsync(
                loadPlugin(data.full_path),
                async (p: Plugin) => {
                    const { env, ref } = k.create_local_plugin_environment(ident);
                    await p(env);
                    return ref;
                }
            ),
        }
    }

    return res;
}
