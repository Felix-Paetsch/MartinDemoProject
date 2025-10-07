import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        host: true
    },
    build: {
        lib: {
            entry: {
                'pluginSystem/kernel_exports': 'src/pluginSystem/kernel_exports.ts',
                'pluginSystem/plugin_exports': 'src/pluginSystem/plugin_exports.ts',
                'messaging/exports': 'src/messaging/exports.ts',
                'utils/exports': 'src/utils/exports.ts',
                'libraries/exports': 'src/libraries/exports.ts',
                "index": 'src/index.ts'
            },
            formats: ['es']
        },
        rollupOptions: {
            external: ['effect', 'uuid', 'quickjs-emscripten'],
            output: {
                globals: {
                    'effect': 'Effect',
                    'uuid': 'uuid',
                    'quickjs-emscripten': 'QuickJS'
                }
            }
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
    }
}); 
