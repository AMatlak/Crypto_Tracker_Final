import React, { useState } from "react";
import { MdEmail } from "react-icons/md";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import "./Reset.css"; //imports reset css stylings

const Reset = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent. Please check your inbox");
        } catch (err) {
            setError("Failed to send password reset email.Please try again");
        }
    };

    return (
        <div className="reset-container">
            <div className="container">
                <div className="header">
                    <div className="text">Forgotten Password</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    <form onSubmit={handleResetPassword}>
                        {/*email address input for reset password email */}
                        <div className="input">
                            <MdEmail className="email-icon" />
                            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                        </div>

                        {/*reset password button*/}
                        <div className="button-container">
                            <button type="submit">Reset Password</button>
                        </div>

                        {message && <p className="message">{message}</p>}
                        {error && <p className="error">{error}</p>}

                        {/*back to login page href using route path from app.js*/}
                        <div className="register-text">
                            <p> Password reset? Click back to <a href="/">Login!</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Reset;
