import { readdirSync, statSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// Find all plugin/library directories (subdirectories with index.ts files)
const libDirs = readdirSync(__dirname).filter((name) => {
    const fullPath = resolve(__dirname, name);
    return (
        statSync(fullPath).isDirectory() &&
        name !== 'node_modules' &&
        name !== 'dist' &&
        statSync(resolve(fullPath, 'index.ts')).isFile()
    );
});

// Create build entries for each library
const libEntries = libDirs.reduce((entries, libDir) => {
    entries[libDir] = resolve(__dirname, libDir, 'index.ts');
    return entries;
}, {} as Record<string, string>);

export default defineConfig({
    build: {
        lib: {
            // Multiple entry points (one per library)
            entry: libEntries,
            formats: ['es'], // Only ES modules
            fileName: (format, entryName) => `${entryName}.js`
        },
        rollupOptions: {
            output: {
                dir: 'dist',
                assetFileNames: '[name].[ext]',
                inlineDynamicImports: true
            },
            external: [], // Bundle everything
            treeshake: false // Keep all code for development
        },
        target: 'es2020',
        minify: false,
        sourcemap: false
    },
    define: {
        'process.env.BROWSER': 'true'
    }
});