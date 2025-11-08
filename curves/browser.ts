import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { BrowserPlatform } from "pc-messaging-kernel/kernel";

const pc_api_endpoint = "/api/";

async function startServer() {
    const app = express();
    const root = process.cwd();
    const indexHtmlPath = path.resolve(root, "index.html");

    const vite = await createViteServer({
        root,
        resolve: {
            alias: {
                // Map entry points one-to-one with your local library sources
                "pc-messaging-kernel": path.resolve(__dirname, "../lib/src/index.ts"),
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
        server: {
            fs: {
                allow: [".."],
            },
            middlewareMode: true
        },
        appType: "custom",
        build: {
            sourcemap: true,
            minify: false
        },
    });

    const rawHtml = await fs.promises.readFile(indexHtmlPath, "utf-8");
    app.use(vite.middlewares);
    app.use(express.json());

    const apiBase = pc_api_endpoint.endsWith("/")
        ? pc_api_endpoint.slice(0, -1)
        : pc_api_endpoint;

    const pluginsRouter = express.Router();
    pluginsRouter.post("/:route", async (req, res) => {
        return res.send("Currently halted development");
        // const route: any = req.params.route;
        // const body = req.body;
        // const ret = await BrowserPlatform.compute_api_data(route, body);
        // return res.json(ret);
    });

    app.use(`${apiBase}`, pluginsRouter);
    app.use(/.*/, async (req, res, next) => {
        try {
            const html = await vite.transformIndexHtml(req.originalUrl, rawHtml);
            res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (err) {
            vite.ssrFixStacktrace(err as Error);
            next(err);
        }
    });

    const port = 5173;
    app.listen(port, () => {
        console.log(`Server + Vite running at http://localhost:${port}`);
        // console.log(`API base: ${apiBase}/`);
    });
}

startServer();
