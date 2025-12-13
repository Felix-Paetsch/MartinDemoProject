import { useEffect } from "react";
import { ColorPickerUI } from "./ui.js";
import { initColorPickerPlugin } from "./loader.js";

export default function ColorPicker() {
    useEffect(() => {
        initColorPickerPlugin();
    }, []);

    return <ColorPickerUI />;
}
