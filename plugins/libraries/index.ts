import express, { NextFunction, Request, Response } from 'express';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 5174;
const DIST_DIR = resolve(__dirname, 'dist');

const app = express();

// Enable CORS
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Serve static files from dist directory
app.use(express.static(DIST_DIR, {
    setHeaders: (res: Response) => {
        res.set('Cache-Control', 'no-cache');
    }
}));

app.listen(PORT, () => {
    console.log(`🚀 Static file server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${DIST_DIR}`);
});
