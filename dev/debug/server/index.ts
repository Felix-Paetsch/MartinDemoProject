import express from "express";
import fs from "fs";

const app = express();
const PORT = 4000;

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/", (req, res) => {
    try {
        const jsonData = req.body;
        fs.appendFileSync("debug/logs/external_logs.log", JSON.stringify(jsonData, null, 2) + "\n");
        res.json({ status: "ok" });
    } catch (err) {
        res.status(500).json({ error: "Failed to write data" });
    }
});

app.post("/clear", (req, res) => {
    fs.writeFileSync("debug/logs/external_logs.log", "");
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});