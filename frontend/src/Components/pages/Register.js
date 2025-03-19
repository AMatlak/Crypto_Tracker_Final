import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth"; //firebase function for user auth
import { auth } from "../../firebase"; //importing firebase auth instance
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

const Register = () => {
    //variables to store user input
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); //new state for confirm password
    const [error, setError] = useState("");
    const navigate = useNavigate();

    //function to handle user register
    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if(password !== confirmPassword) {
            setError("Passwords does not match");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password); //firebase login auth
            navigate("/dashboard");  //redirects to dashboard after successful signup
        } catch (err) {
            setError("Error creating account. Try again.");
        }
    };

    return (
        <div className="register-container"> {/*The below code is the ui for the register page*/}
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

                                <div className="input">
                                <RiLockPasswordFill className="password-icon" />
                                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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

export default Register; //exporting the register to component


