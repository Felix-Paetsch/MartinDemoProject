// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import MainReactPage from "./pages/MainReact.js";
import SideReactPage from "./pages/SideReact.js";

export default function App() {
    return (
        <Routes>
            <Route path="/main_react" element={<MainReactPage />} />
            <Route path="/side_react" element={<SideReactPage />} />
        </Routes>
    );
}
