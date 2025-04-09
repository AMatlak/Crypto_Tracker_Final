import React from "react";
import { useEffect } from "react";
import { auth } from "../../firebase";
import { Link, Outlet, useNavigate } from "react-router-dom"; //importing routing components from react router
import { BsCurrencyBitcoin } from "react-icons/bs"; //bitcoin icon
import { IoHome } from "react-icons/io5"; //home icon
import { FaWallet } from "react-icons/fa"; //wallet icon for portfolio
import { TbPresentationAnalytics } from "react-icons/tb"; //analytics icon
import { IoMdSettings } from "react-icons/io"; //settings icon
import { IoExit } from "react-icons/io5"; //exit icon
import "./Dashboard.css"; //importing css styling sheet for dashboard

const Dashboard = () => {
    //hook for naviagation 
    const navigate = useNavigate();

    //checks if user is authenticated when dashboard loads and redirects to login page if not(protected routes)
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
          if (!user) {
            navigate("/"); //redirects to login if not logged in
          }
        });
      
        return () => unsubscribe();
      }, []);

    //function for user logout
    const handleLogout = () => {
        localStorage.removeItem("user"); //removes user session
        navigate("/"); //redirects to login page
    };

    return (
        <div className="dashboard-container"> {/*the below code is for the ui for dashboard interface */}
            <div className="sidebar">
                <div className="logo-icon">
                    <BsCurrencyBitcoin className="bitcoin-logo"/>
                    <p>CPT</p>
                </div>

                {/*sidebar menu with navigation links*/}
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

export default Dashboard; //exporting dashboard component for use isn app.js
