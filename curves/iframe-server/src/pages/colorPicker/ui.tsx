import React, { useRef, useState } from "react";
import styles from "./styles.module.css";

let onColorChangeCb: (color: string) => void = () => { };
let _getColor: () => string = () => "#ffffff";
let _setColor: (color: string) => void = () => { };
let _flash: () => void = () => { };

export function ColorPickerUI() {
    const [color, setColor] = useState("black");
    const [flashing, setFlashing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    _getColor = () => color;
    _setColor = (newColor: string) => setColor(newColor);
    _flash = () => {
        setFlashing(true);
        setTimeout(() => setFlashing(false), 500);
    };

    const handleColorClick = () => inputRef.current?.click();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setColor(newColor);
        onColorChangeCb(newColor);
    };

    return (
        <div
            className={`${styles.picker} ${flashing ? styles.flash : ""}`}
            style={{ backgroundColor: color }}
            onClick={handleColorClick}
        >
            <input
                ref={inputRef}
                type="color"
                value={color}
                style={{ display: "none" }}
                onChange={handleInputChange}
            />
        </div>
    );
}

export const ColorPickerAPI = {
    onColorChange: (cb: (color: string) => void) => {
        onColorChangeCb = cb;
    },
    getColor: () => _getColor(),
    setColor: (color: string) => _setColor(color),
    flash: () => _flash(),
};
