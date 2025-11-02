import fs from "fs";
import url from "url";
import path from "path";
import { mapBothAsync } from "../../../../utils/error_handling";
import { Plugin } from "../../../../pluginSystem/kernel_exports";

export interface LocalPluginData {
    full_path: string;
    ext: ".ts" | ".js";
    load: () => Promise<Error | Plugin>;
}

async function exists(p: string): Promise<boolean> {
    try {
        await fs.promises.access(p);
        return true;
    } catch {
        return false;
    }
}

async function loadPlugin(full_path: LocalPluginData["full_path"]) {
    const fileUrl = url.pathToFileURL(full_path).href;
    return mapBothAsync(
        import(fileUrl).catch((r) => r as Error),
        (m) => m.default as Plugin,
        (e) => e as Error
    );
}

async function findLocalPlugins(): Promise<
    Record<string, LocalPluginData>
> {
    const projectRoot = process.cwd();
    const targetRoot = path.resolve(projectRoot, "plugins", "local");
    const results: Record<string, LocalPluginData> = {};

    async function walk(dir: string): Promise<void> {
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
                    ext,
                    load: () => loadPlugin(full_path),
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

async function findRootPlugin(): Promise<LocalPluginData | null> {
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
        ext,
        load: () => loadPlugin(full_path),
    };
}

export async function getLocalPlugins(): Promise<
    Record<string, LocalPluginData>
> {
    const [localPlugins, rp] = await Promise.all([
        findLocalPlugins(),
        findRootPlugin(),
    ]);

    if (rp) {
        localPlugins["root"] = rp;
    }

    return localPlugins;
}
