import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    root: path.resolve(__dirname),
    base: "/curves/",
    publicDir: false,
    server: {
        port: 3000,
        open: true,
        fs: {
            allow: [
                path.resolve(__dirname),
                path.resolve(__dirname, "../lib"),
            ],
        },
    },

    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "pc-messaging-kernel/kernel": path.resolve(
                __dirname,
                "../lib/src/pluginSystem/kernel_exports.ts"
            ),
            "pc-messaging-kernel/plugin": path.resolve(
                __dirname,
                "../lib/src/pluginSystem/plugin_exports.ts"
            ),
            "pc-messaging-kernel/messaging": path.resolve(
                __dirname,
                "../lib/src/messaging/exports.ts"
            ),
            "pc-messaging-kernel/utils": path.resolve(
                __dirname,
                "../lib/src/utils/exports.ts"
            ),
            "pc-messaging-kernel/libraries": path.resolve(
                __dirname,
                "../lib/src/libraries/exports.ts"
            ),
        },
    },

    esbuild: {
        tsconfigRaw: require("./tsconfig.json"),
    },

    build: {
        outDir: "../dist",
        emptyOutDir: false,
        sourcemap: true,
    }
});
