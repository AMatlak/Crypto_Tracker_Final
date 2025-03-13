import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");  //redirects to dashboard after login
        } catch (err) {
            setError("Invalid email or password");
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

                        <div className="register-text">
                        <p>Don't have an account? <a href="/register">Register!</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;


