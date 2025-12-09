import express from "express";
import cors from "cors";
import { Logging } from "pc-messaging-kernel/messaging";
import { process_log } from "./server/process_log";

async function startServer(port = 3005) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.post("/logging", async (req, res) => {
        const body: Logging.Log = req.body;
        process_log(body);

        res.send("ok");
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer();
