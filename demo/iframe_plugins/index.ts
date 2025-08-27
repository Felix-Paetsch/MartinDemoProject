import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
async function startServer() {
    const server = await createServer({
        root: resolve(__dirname, 'public'), // Only serve from public directory
        server: {
            port: 3001,
            host: true
        },
        plugins: [],
        optimizeDeps: {
            include: []
        }
    });

    await server.listen();
    console.log('Plugin server running at http://localhost:3001');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await server.close();
        process.exit(0);
    });
}

startServer().catch(console.error);
