import express from "express";
import cors from "cors";
import { BrowserPlatform, PluginServer } from "pc-messaging-kernel/kernel";

async function startServer(port = 3001) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.post("/available_iframe_plugins", async (req, res) => {
        const plugins: PluginServer.PluginsAPIData = [{
            root_url: `http://localhost:3002/main_react`,
            type: "iframe",
            name: "main_react"
        }, {
            root_url: `http://localhost:3002/side_react`,
            type: "iframe",
            name: "side_react"
        }];

        return res.json(plugins);
    });

    app.post("/:route", async (req, res) => {
        const route = req.params.route;
        const body = req.body;
        const ret = await BrowserPlatform.compute_api_data(route, body);
        return res.json(ret);
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer();
