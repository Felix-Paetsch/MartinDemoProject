import fs from "fs";
import path from "path";

export type BackendLocalPluginData = {
    name: string;
    path: string;
    ext: ".ts" | ".js";
}

async function exists(p: string): Promise<boolean> {
    try {
        await fs.promises.access(p);
        return true;
    } catch {
        return false;
    }
}

async function findLocalPlugins(): Promise<
    Record<string, BackendLocalPluginData>
> {
    const projectRoot = process.cwd();
    const targetRoot = path.resolve(projectRoot, "plugins", "local");
    const results: Record<string, BackendLocalPluginData> = {};

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

                const relativePath = path
                    .relative(projectRoot, full_path)
                    .replace(/\.[tj]s$/, "")
                    .split(path.sep)
                    .join("/");

                results[entry.name] = {
                    name: entry.name,
                    path: relativePath,
                    ext,
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

async function findRootPlugin(): Promise<BackendLocalPluginData | null> {
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

    const relativePath = path
        .relative(projectRoot, full_path)
        .replace(/\.[tj]s$/, "")
        .split(path.sep)
        .join("/");

    return {
        name: "root",
        path: relativePath,
        ext,
    };
}

export async function api_endpoints_get_local_plugins() {
    const [localPlugins, rp] = await Promise.all([
        findLocalPlugins(),
        findRootPlugin(),
    ]);

    if (rp) {
        localPlugins["root"] = rp;
    }

    return localPlugins;
}
