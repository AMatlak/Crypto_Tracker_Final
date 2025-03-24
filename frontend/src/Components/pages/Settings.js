import React, { useState, useEffect } from "react";
import { IoMdSettings } from "react-icons/io";
import { auth } from "../../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"; //imports firebase update password functions and others
import "./Settings.css"; //imports Settings.css stylings for this page

//settings component for password updates and 2fa
const Settings = () => {
    //states for password change
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [message, setMessage] = useState("");

    //states for 2fa 
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [mfaEnabled, setMfaEnabled] = useState(false);

    //checks 2fa status on component mount
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

    //function to handle password change
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

    //funcition to enable 2fa through generating qr code and secret 
    const enable2FA = async () => {
        try {
            const user = auth.currentUser;
            //message if no user is signed in(error message)
            if (!user) {
                setMessage("No user is currently signed in.");
                return;
            }

            //request qr code and secret from backend
            const response = await fetch("http://localhost:5000/generate-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });

            const data = await response.json();
            if (data.qrCode && data.secret) {
                setQrCode(data.qrCode); //sets qr code image
                setSecret(data.secret); //sets secret to verify 
                setMessage("Scan the QR Code with Google Authenticator.");
            } else {
                setMessage("Failed to enable 2FA. Try again.");
            }
        } catch (error) {
            setMessage("Error enabling 2FA.");
        }
    };

    //function to verify the one time passcode entered by the user against the secret
    const verify2FA = async () => {
        try {
            //sends a post request to backend to verify the entered otp
            const response = await fetch("http://localhost:5000/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: auth.currentUser.email, token: verificationCode }),
            });

            //parse json response from server
            const data = await response.json();

            //if server has verified then token successfull
            if (data.success) {
                setMfaEnabled(true); //updates state to show that 2fa is successful
                setMessage("2FA Verified Successfully!");
            } else {
                setMessage("Invalid Code. Try again."); //error message if one time passcode invalid
            }
        } catch (error) {
            setMessage("Verification failed.");
        }
    };

    //function to disable 2fa and remove stored secret
    const disable2FA = async () => {
        try {
            //gets the currently logged in user
            const user = auth.currentUser;

            //if no user logged in error message appears
            if (!user) {
                setMessage("No user is currently signed in.");
                return;
            }

            //sends a post request to the backend to disable 2fa
            const response = await fetch("http://localhost:5000/disable-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });

            //parse json response from server
            const data = await response.json();

            //clears qr code and secret if successful disabled
            if (data.success) {
                setMfaEnabled(false);
                setQrCode(""); //clears qr code
                setSecret(""); //clears secret
                setMessage("2FA Disabled Successfully!"); //message to user that 2fa disabled
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
                {/*change password section*/}
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

                    {/*confirm password input*/}
                    <div className="input-group">
                        <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required/>
                    </div>

                    {/*update password container and button*/}
                    <div className="update-password-container">
                        <button type="submit" className="update-password-btn">Update Password</button>
                    </div>
                </form>
                {message && <p className="message">{message}</p>}
            </div>

            <div className="settings-section">
                {/*2fa section*/}
                <h2>Two-Factor Authentication</h2>

                <div className="button-container">
                {!mfaEnabled ? (
                    <button className="enable-2fa-btn" onClick={enable2FA}>Enable 2FA</button>
                ) : (
                    <button className="disable-2fa-btn" onClick={disable2FA}>Disable 2FA</button>
                )}
                </div>

                {qrCode && (
                    <div className="qr-container">
                        <img src={qrCode} alt="Scan this QR Code" />
                        <p>Scan this QR Code in Google Authenticator.</p>
                        <div className="input-group">
                        <input type="text" placeholder="Enter Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                        </div>
                        <div className="button-container">
                        <button className="verify-2fa-btn" onClick={verify2FA}>Verify Code</button>
                        </div>
                    </div>
                )}
                <p>{message}</p>
            </div>
        </div>
    );
};

export default Settings;
