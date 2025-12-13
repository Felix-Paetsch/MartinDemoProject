// src/App.jsx
import { Routes, Route } from "react-router-dom";
import ColorDisplay from "./pages/colorDisplay/index.js";
import ColorPicker from "./pages/colorPicker/index.js";

export default function App() {
    return (
        <Routes>
            <Route path="/color_display" element={<ColorDisplay />} />
            <Route path="/color_picker" element={<ColorPicker />} />
        </Routes>
    );
}
