import { Plugin } from "pc-messaging-kernel/pluginSystem";
import {
    BrowserPlatform,
} from "pc-messaging-kernel/platform";
import { Json } from "pc-messaging-kernel/utils";
import React, { useEffect, useState } from "react";
import * as Assets from "../../../lib/assets/exports";

export default function SideReact() {
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const plugin: Plugin = async (env) => {
            console.log("<< STARTING Side React PLUGIN >>");

            const BoundEnv = new Assets.AssetManager(env);
            const readRes = await BoundEnv.read_file(
                "shared_value"
            );
            if (readRes instanceof Error) throw readRes;

            const initialContent: Json = readRes?.contents || "(no contents)";
            setMessage("" + initialContent);

            await BoundEnv.subscribe(
                "shared_value",
                (e: Assets.FileEvent) => {
                    if (e.type === "CHANGE_FILE_CONTENT") {
                        setMessage("" + e.contents);
                    }
                }
            );
        };

        BrowserPlatform.start_iframe_plugin(plugin);
    }, []);

    const hue = Math.floor(Math.random() * 360);
    const backgroundColor = `hsla(${hue}, 100%, 50%, 0.7)`;

    const styles: React.CSSProperties = {
        textAlign: "center",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem 3rem",
        borderRadius: "10px",
        backgroundColor,
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    };

    return (
        <div style={styles}>
            <h1>About</h1>
            <p>This page is part of a React + Vite demo project!</p>

            {message && (
                <pre
                    style={{
                        marginTop: "2rem",
                        fontSize: "1rem",
                        fontWeight: 500,
                        textAlign: "left",
                        maxWidth: "600px",
                        background: "rgba(0,0,0,0.3)",
                        padding: "1rem",
                        borderRadius: "8px",
                        overflowX: "auto",
                    }}
                >
                    {message}
                </pre>
            )}
        </div>
    );
}
