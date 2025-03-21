import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth"; //firebase function for user auth
import { auth } from "../../firebase"; //importing firebase auth instance
import { useNavigate } from "react-router-dom";
import "./Login.css"; //importing stylesheet
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

const Login = () => {
    //variables to store user input and error messages
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate(); //navigation between pages
    
    const [otp, setOtp] = useState("");
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);
    

    //function to handle user loging
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            //checks if the user logging in has 2fa enabled
            const response = await fetch("http://localhost:5000/check-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (data.mfaEnabled) {
                setMfaEnabled(true);
                setShowOtpField(true);
                return; //waits for google passcode to be entered to move user forward
            }

            //if 2FA is not enabled user is pushed straight to dashboard
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid email or password");
        }
    };

    const verifyOtp = async () => {
        try {
            const response = await fetch("http://localhost:5000/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token: otp }),
            });
            const data = await response.json();

            if (data.success) {
                navigate("/dashboard"); //uses navigate to move user to dashboard after successful google passcode login
            } else {
                setError("Invalid OTP. Try again.");
            }
        } catch (error) {
            setError("Error verifying OTP.");
        }
    };

    return (
        <div className="login-container">
            <div className="container">
                <div className="header">
                    <div className="text">Crypto Portfolio Tracker</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    {error && <p className="error">{error}</p>}
                    {!showOtpField ? (
                        <form onSubmit={handleLogin}>
                            <div className="input">
                                <MdEmail className="email-icon" />
                                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>

                            <div className="input">
                                <RiLockPasswordFill className="password-icon" />    
                                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>

                            <div className="button-container">
                                <button type="submit">Login</button>
                            </div>
                        </form>
                    ) : (
                        <div className="passcode-container">
                            <p>Enter your One Time Passcode from Google Authenticator</p>
                            <input type="text" className="passcode-input" placeholder="Enter Passcode" value={otp} onChange={(e) => setOtp(e.target.value)} />
                            <button className="passcode-button" onClick={verifyOtp}>Verify Passcode</button>
                        </div>
                    )}

                    <div className="register-text">
                        <p>Don't have an account? <a href="/register">Register!</a></p>
                    </div>
                    <div className="reset-text">
                        <p>Forgotten your password? <a href="/reset">Reset!</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
