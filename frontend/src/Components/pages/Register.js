import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"; 
import { auth } from "../../firebase"; 
import "./Register.css";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";


const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        //confirms if passwords match if not message appears below title of password does not match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            //create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            //sends email verification
            await sendEmailVerification(user);
            setError("A verification email has been sent.\nPlease verify your email before logging in.");

            setEmail("");
            setPassword("");
            setConfirmPassword("");
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
                        {/*email address input*/}
                        <div className="input">
                            <MdEmail className="email-icon" />
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>

                        {/*password input*/}
                        <div className="input">
                            <RiLockPasswordFill className="password-icon" />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        {/*confirm password input*/}
                        <div className="input">
                            <RiLockPasswordFill className="password-icon" />
                            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>

                        {/*sign up button*/}
                        <div className="button-container">
                            <button type="submit">Sign Up</button>
                        </div>
                    </form>

                    <div className="login-back-text">
                        <p>Already have an account? <a href="/">Login!</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
