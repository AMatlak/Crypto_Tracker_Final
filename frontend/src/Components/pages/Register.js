import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");  //redirects to dashboard after successful signup
        } catch (err) {
            setError("Error creating account. Try again.");
        }
    };

    return (
        <div className="register-container">
                    <div className="container">
                        <div className="header">
                            <div className="text">Register</div>
                            <div className="underline"></div>
                        </div>
        
                        <div className="inputs">
                        {error && <p className="error">{error}</p>}
                            <form onSubmit={handleRegister}>
                                <div className="input">
                                <MdEmail className="email-icon" />
                                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
        
                                <div className="input">
                                <RiLockPasswordFill className="password-icon" />    
                                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
        
                                <div className="button-container">
                                <button type="submit">Sign Up</button>
                                </div>
        
                                <div className="login-back-text">
                                <p>Already have an account? <a href="/">Login!</a></p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
    );
};

export default Register;


