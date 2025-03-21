import React, { useState, useEffect } from "react";
import { IoMdSettings } from "react-icons/io";
import { auth } from "../../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"; //imports firebase update password functions and others
import "./Settings.css"; //imports Settings.css stylings for this page

const Settings = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [mfaEnabled, setMfaEnabled] = useState(false);

    useEffect(() => {
        const check2FAStatus = async () => {
            const user = auth.currentUser;
            if (!user) return;
            const response = await fetch("http://localhost:5000/check-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });
            const data = await response.json();
            setMfaEnabled(data.mfaEnabled);
        };
        check2FAStatus();
    }, []);

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

    const enable2FA = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setMessage("No user is currently signed in.");
                return;
            }

            const response = await fetch("http://localhost:5000/generate-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });

            const data = await response.json();
            if (data.qrCode && data.secret) {
                setQrCode(data.qrCode);
                setSecret(data.secret);
                setMessage("Scan the QR Code with Google Authenticator.");
            } else {
                setMessage("Failed to enable 2FA. Try again.");
            }
        } catch (error) {
            setMessage("Error enabling 2FA.");
        }
    };

    const verify2FA = async () => {
        try {
            const response = await fetch("http://localhost:5000/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: auth.currentUser.email, token: verificationCode }),
            });
            const data = await response.json();
            if (data.success) {
                setMfaEnabled(true);
                setMessage("2FA Verified Successfully!");
            } else {
                setMessage("Invalid Code. Try again.");
            }
        } catch (error) {
            setMessage("Verification failed.");
        }
    };

    const disable2FA = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setMessage("No user is currently signed in.");
                return;
            }

            const response = await fetch("http://localhost:5000/disable-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });

            const data = await response.json();
            if (data.success) {
                setMfaEnabled(false);
                setQrCode("");
                setSecret("");
                setMessage("2FA Disabled Successfully!");
            } else {
                setMessage("Failed to disable 2FA. Try again.");
            }
        } catch (error) {
            setMessage("Error disabling 2FA.");
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <IoMdSettings className="settings-icon" />
                <h1>Settings</h1>
            </div>

            <div className="settings-section">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange}>
                    <div className="input-group">
                        <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required/>
                    </div>
                    <div className="input-group">
                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
                    </div>
                    <div className="input-group">
                        <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required/>
                    </div>
                    <div className="update-password-container">
                        <button type="submit" className="update-password-btn">Update Password</button>
                    </div>
                </form>
                {message && <p className="message">{message}</p>}
            </div>

            <div className="settings-section">
                <h2>Two-Factor Authentication (2FA)</h2>
                {!mfaEnabled ? (
                    <button className="enable-2fa-btn" onClick={enable2FA}>Enable 2FA</button>
                ) : (
                    <button className="disable-2fa-btn" onClick={disable2FA}>Disable 2FA</button>
                )}
                {qrCode && (
                    <div className="qr-container">
                        <img src={qrCode} alt="Scan this QR Code" />
                        <p>Scan this QR Code in Google Authenticator.</p>
                        <div className="input-group">
                        <input type="text" placeholder="Enter Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                        </div>
                        <button className="verify-2fa-btn" onClick={verify2FA}>Verify Code</button>
                    </div>
                )}
                <p>{message}</p>
            </div>
        </div>
    );
};

export default Settings;
