import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { IoHome } from "react-icons/io5";
import { FaWallet } from "react-icons/fa";
import { TbPresentationAnalytics } from "react-icons/tb";
import { IoMdSettings } from "react-icons/io";
import { IoExit } from "react-icons/io5";
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("user"); //removes user session
        navigate("/"); //redirects to login page
    };

    return (
        <div className="dashboard-container">
            <div className="sidebar">
                <div className="logo-icon">
                    <BsCurrencyBitcoin className="bitcoin-logo"/>
                    <p>CPT</p>
                </div>

                <div className="menu-list">
                    <Link to="/dashboard" className="item">
                        <IoHome className="icon"/> Home
                    </Link>
                    <Link to="/dashboard/portfolio" className="item">
                        <FaWallet className="icon" /> Portfolio
                    </Link>
                    <Link to="/dashboard/analytics" className="item">
                        <TbPresentationAnalytics className="icon" /> Analytics
                    </Link>
                    <Link to="/dashboard/settings" className="item">
                        <IoMdSettings className="icon" /> Settings
                    </Link>
                </div>

                {/*logout button inside a container*/}
                <div className="logout-container">
                    <button className="logout-button" onClick={handleLogout}>
                        <IoExit className="icon" /> Logout
                    </button>
                </div>
            </div>

            <div className="main-content">
                <Outlet />
            </div>
        </div>
    );
};

export default Dashboard;
