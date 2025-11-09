import express from "express";
import cors from "cors";
import { BrowserPlatform } from "pc-messaging-kernel/kernel";

async function startServer() {
    const app = express();

    // add this before routes
    app.use(cors());

    app.use(express.json());

    app.post("/:route", async (req, res) => {
        const route = req.params.route;
        const body = req.body;
        const ret = await BrowserPlatform.compute_api_data(route, body);
        return res.json(ret);
    });

    const port = 3001;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer();
