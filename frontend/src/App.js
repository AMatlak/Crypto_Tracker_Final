import React from "react"; //import react
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; //import routing components from react
import Login from "./Components/pages/Login"; //the below import all page components for routing
import Register from "./Components/pages/Register";
import Reset from "./Components/pages/Reset";
import Dashboard from "./Components/pages/Dashboard";
import Home from "./Components/pages/Home";
import Portfolio from "./Components/pages/Portfolio";
import Analytics from "./Components/pages/Analytics";
import Settings from "./Components/pages/Settings";

//main app with routing configuration
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset" element={<Reset />} />
                
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
