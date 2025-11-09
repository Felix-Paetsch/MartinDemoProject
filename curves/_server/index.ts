import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { PluginServer } from "pc-messaging-kernel/kernel"

const app = express();
const PORT = process.env.PORT || 3000;
const ownUrl = `http://localhost:${PORT}`

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "iframes"));

app.get("/test", (req, res) => {
    res.render("test", { title: "Test Iframe View" });
});

app.post("/plugins", (req, res) => {
    const plugin_data: PluginServer.PluginsAPIData = [{
        "name": "testIframe",
        "type": "iframe",
        "root_url": ownUrl + "/test"
    }];

    res.json(plugin_data);
})

app.listen(PORT, () => {
    console.log(`Server running at ${ownUrl}`);
});
