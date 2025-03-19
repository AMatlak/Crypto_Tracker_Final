import React, { useState } from "react";
import { IoMdSettings } from "react-icons/io";
import { auth } from "../../firebase"; //import firebase auth
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"; //imports firebase update password functions and others
import "./Settings.css";

const Settings = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage("");

        const user = auth.currentUser; //gets current logged in user

        //message if no user is logged in(error message)
        if (!user) {
            setMessage("No user is currently signed in.");
            return;
        }

        //if new password and confirm new password not the same error message appears
        if (newPassword !== confirmNewPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            //reauthenticates user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            //updates to new password
            await updatePassword(user, newPassword);
            setMessage("Password updated successfully!");
            
            //clears input fields for better user experience
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");

        } catch (error) {
            //message if current password entered incorrect
            setMessage("Current password incorrect, Please try again");
        }
    };

    return (
        <div className="settings-container">
            {/*settings title*/}
            <div className="settings-header">
                <IoMdSettings className="settings-icon" />
                <h1>Settings</h1>
            </div>

            {/*change password section form*/}
            <div className="settings-section">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange}>
                    {/*current password input*/}
                    <div className="input-group">
                        <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required/>
                    </div>
                    
                    {/*new password input*/}
                    <div className="input-group">
                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
                    </div>

                    {/*confirm new password input*/}
                    <div className="input-group">
                        <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required/>
                    </div>

                    {/*update password button*/}
                    <div className="update-password-container">
                        <button type="submit" className="update-password-btn">Update Password</button>
                    </div>
                </form>
                {message && <p className="message">{message}</p>} {/*displays message such as password updated successfully*/}
            </div>

            {/*2FA enable section*/}
            <div className="settings-section">
                <h2>Two-Factor Authentication (2FA)</h2>
                <button className="enable-2fa-btn">Enable 2FA</button>
            </div>
        </div>
    );
};

export default Settings;