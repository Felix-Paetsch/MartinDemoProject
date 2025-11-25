import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "pc-messaging-kernel/kernel": path.resolve(
                __dirname,
                "../../lib/src/pluginSystem/kernel_exports.ts"
            ),
            "pc-messaging-kernel/plugin": path.resolve(
                __dirname,
                "../../lib/src/pluginSystem/plugin_exports.ts"
            ),
            "pc-messaging-kernel/messaging": path.resolve(
                __dirname,
                "../../lib/src/messaging/exports.ts"
            ),
            "pc-messaging-kernel/utils": path.resolve(
                __dirname,
                "../../lib/src/utils/exports.ts"
            ),
            "pc-messaging-kernel/libraries": path.resolve(
                __dirname,
                "../../lib/src/libraries/exports.ts"
            ),
        },
    },
})
