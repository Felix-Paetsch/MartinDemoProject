import { readdirSync, statSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// Find all plugin directories (subdirectories with index.ts files)
const pluginDirs = readdirSync(__dirname)
    .filter(name => {
        const fullPath = resolve(__dirname, name);
        return statSync(fullPath).isDirectory() &&
            name !== 'node_modules' &&
            name !== 'dist' &&
            statSync(resolve(fullPath, 'index.ts')).isFile();
    });

// Create build entries for each plugin
const buildEntries = pluginDirs.reduce((entries, pluginDir) => {
    entries[pluginDir] = resolve(__dirname, pluginDir, 'index.ts');
    return entries;
}, {} as Record<string, string>);

export default defineConfig({
    build: {
        rollupOptions: {
            input: buildEntries,
            output: {
                dir: 'dist',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
                format: 'es',
                inlineDynamicImports: true
            },
            external: [], // Bundle everything
            treeshake: false // Keep all code for development
        },
        target: 'es2020',
        minify: false,
        sourcemap: false
    },
    optimizeDeps: {
        include: ['pc-messaging-kernel'],
        force: true
    },
    define: {
        'process.env.BROWSER': 'true'
    }
});
