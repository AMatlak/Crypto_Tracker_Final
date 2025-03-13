import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Components/pages/Login";
import Register from "./Components/pages/Register";
import Dashboard from "./Components/pages/Dashboard";
import Home from "./Components/pages/Home";
import Portfolio from "./Components/pages/Portfolio";
import Analytics from "./Components/pages/Analytics";
import Settings from "./Components/pages/Settings";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/*dashboard with nested routes*/}
                <Route path="/dashboard" element={<Dashboard />}>
                    <Route index element={<Home />} />
                    <Route path="portfolio" element={<Portfolio />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;
