import { Plugin } from "pc-messaging-kernel/plugin";
import { BrowserPlatform } from "pc-messaging-kernel/kernel";
import React, { useEffect, useRef, useState } from "react";
import * as Assets from "../../../lib/assets/exports";
import { CreateResult, WriteResult } from "../../../lib/assets/operation_result";

let pluginStarted = false;

export default function MainReact() {
    const [message, setMessage] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState<string>("");
    const [token, setToken] = useState<string | null>(null);

    const envRef = useRef<any>(null);

    useEffect(() => {
        if (pluginStarted) {
            console.log("MainReact plugin already initialized, skipping setup.");
            return;
        }
        pluginStarted = true;

        const plugin: Plugin = async (env) => {
            console.log("<< STARTING Main React PLUGIN >>");
            envRef.current = env;

            const res: CreateResult | Error = await Assets.LocalMethods.perform_operation(
                env,
                Assets.create_operation("shared_value", {}, "Hello")
            );

            if (res instanceof Error || typeof res === "string") {
                throw res;
            }

            console.log("Created shared_value with token:", res.recency_token);
            setToken(res.recency_token);

            await env.get_plugin({
                name: "side_react",
                version: "1.0.0",
            });
        };

        BrowserPlatform.start_iframe_plugin(plugin);
    }, []);

    const handleWrite = async () => {
        const env = envRef.current;
        if (!env) {
            console.warn("Plugin environment not ready yet");
            return;
        }
        if (!token) {
            console.warn("No recency token available yet");
            return;
        }

        try {
            const result: WriteResult | Error = await Assets.LocalMethods.perform_operation(
                env,
                Assets.write_operation("shared_value", token, inputValue)
            );

            if (!(result instanceof Error || typeof result === "string")) {
                if (result.recency_token) {
                    setToken(result.recency_token);
                    console.log("Updated recency token:", result.recency_token);
                }
            }

            setMessage(`Wrote "${inputValue}" to shared_value`);
            setInputValue("");
        } catch (err) {
            console.error("Error writing value:", err);
            setMessage("Error writing value.");
        }
    };

    // 🎨 Styling
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
            <h1>Main Plugin</h1>
            <p>This interacts with the shared_value file.</p>

            <div style={{ marginTop: "2rem" }}>
                <input
                    type="text"
                    placeholder="Enter new value..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{
                        padding: "0.5rem",
                        fontSize: "1rem",
                        borderRadius: "5px",
                        border: "none",
                        marginRight: "0.5rem",
                    }}
                />
                <button
                    onClick={handleWrite}
                    style={{
                        padding: "0.6rem 1.2rem",
                        fontSize: "1rem",
                        borderRadius: "5px",
                        border: "none",
                        cursor: "pointer",
                        background: "#0ff",
                        color: "#000",
                        fontWeight: 600,
                    }}
                >
                    Write
                </button>
            </div>

            {message && (
                <p
                    style={{
                        marginTop: "1.5rem",
                        fontSize: "1.1rem",
                        fontWeight: 500,
                    }}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
