import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        host: true
    },
    build: {
        lib: {
            entry: {
                'exports': 'src/utils/exports.ts',
                'debug/exports': 'src/debug/exports.ts',
                'pluginSystem/common_lib/exports': 'src/pluginSystem/common_lib/exports.ts',
                'pluginSystem/plugin_lib/exports': 'src/pluginSystem/plugin_lib/exports.ts',
                'pluginSystem/kernel_lib/exports': 'src/pluginSystem/kernel_lib/exports.ts',
                'messaging/exports': 'src/messaging/exports.ts',
                'utils/exports': 'src/utils/exports.ts'
            },
            formats: ['es']
        },
        sourcemap: true
    },
    resolve: {
        alias: {
            "@": "/src",
            // 👇 replace only in browser builds
            "quickjs-emscripten":
                process.env.BROWSER === "true"
                    ? "https://esm.sh/quickjs-emscripten@0.31.0"
                    : "quickjs-emscripten",
        },
    },
    optimizeDeps: {
        include: ['effect']
    }
}); 