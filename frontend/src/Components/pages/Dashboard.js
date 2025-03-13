import React from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/");
    };

    return (
        <div className="container">
            <h2>Welcome to Your Crypto Dashboard</h2>
            <p>Manage your portfolio here!</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Dashboard;
