import { useEffect } from "react";
import { ColorDisplayUI } from "./ui.js";
import { initColorDisplayPlugin } from "./loader.js";

export default function ColorDisplay() {
    useEffect(() => {
        initColorDisplayPlugin();
    }, []);

    return <ColorDisplayUI />;
}
