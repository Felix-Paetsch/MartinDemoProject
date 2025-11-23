import { Plugin } from "pc-messaging-kernel/plugin";
import {
    BranchedMessagePartner,
    BrowserPlatform,
    PluginMessagePartner,
} from "pc-messaging-kernel/kernel";
import React, { useEffect, useState } from "react";

export default function About() {
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const plugin: Plugin = (env) => {
            console.log("<< STARTING SIDE PLUGIN >>");

            env.on_plugin_request((mp: PluginMessagePartner) => {
                mp.on_branch((b: BranchedMessagePartner) => {
                    b.on_message((data) => {
                        console.log(data + ", and I must scream");
                        setMessage(String(data)); // 👈 update state
                    });

                    b.on_message_listener_registered(async (b) => {
                        await b.send_message("I am here");

                        env.on_remove(() => {
                            console.log("Removing self");
                        });
                    });
                });
            });
        };

        // Start plugin once when component mounts
        BrowserPlatform.start_iframe_plugin(plugin);
    }, []);

    // 🌈 Random neon background
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
                <p style={{ marginTop: "2rem", fontSize: "1.2rem", fontWeight: 500 }}>
                    Received message:
                    <br />
                    <span style={{ color: "#0ff" }}>{message}</span>
                </p>
            )}
        </div>
    );
}
