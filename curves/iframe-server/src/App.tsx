// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Plugin1 from "./pages/Plugin1.js";

export default function App() {
    return (
        <div>
            <nav style={{ marginBottom: "1rem" }}>
                <Link to="/">Home</Link> | <Link to="/about">About</Link>
            </nav>

            <Routes>
                <Route path="/plugin1" element={<Plugin1 />} />
            </Routes>
        </div>
    );
}
