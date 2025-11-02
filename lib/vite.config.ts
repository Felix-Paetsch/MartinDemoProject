import { defineConfig, type LibraryOptions } from 'vite'

function sharedLibConfig(): LibraryOptions {
    return {
        entry: {
            'pluginSystem/kernel_exports': 'src/pluginSystem/kernel_exports.ts',
            'pluginSystem/plugin_exports': 'src/pluginSystem/plugin_exports.ts',
            'messaging/exports': 'src/messaging/exports.ts',
            'utils/exports': 'src/utils/exports.ts',
            'libraries/exports': 'src/libraries/exports.ts',
            index: 'src/index.ts',
        },
        formats: ['es'], // now valid because LibraryOptions.formats uses these literal types
    }
}
const sharedAliases = {
    '@': '/src',
}

export default defineConfig(({ mode }) => {
    const target = process.env.TARGET ?? 'browser'

    const base = {
        sourcemap: true,
        resolve: { alias: sharedAliases },
    }

    if (target === 'node') {
        return defineConfig({
            ...base,
            build: {
                outDir: 'dist/node',
                target: 'node18',
                ssr: true,
                lib: sharedLibConfig(),
                rollupOptions: {
                    external: ['effect', 'uuid', 'quickjs-emscripten', 'fs', 'path', 'url'],
                    output: { format: 'es' },
                },
            },
        })
    }

    // Browser build
    return defineConfig({
        ...base,
        build: {
            outDir: 'dist/browser',
            lib: sharedLibConfig(),
            rollupOptions: {
                external: ['effect', 'uuid', 'quickjs-emscripten'],
                output: {
                    globals: {
                        effect: 'Effect',
                        uuid: 'uuid',
                        'quickjs-emscripten': 'QuickJS',
                    },
                },
            },
        },
        resolve: {
            alias: {
                ...sharedAliases,
                // browser-only quickjs URL import
                'quickjs-emscripten': 'https://esm.sh/quickjs-emscripten@0.31.0',
            },
        },
    })
})
