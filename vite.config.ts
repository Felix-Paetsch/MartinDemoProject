import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        host: true
    },
    resolve: {
        alias: {
            "@": "/demo",
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