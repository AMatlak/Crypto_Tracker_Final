import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth"; //imports firebase method for creating a new user account with email and password
import { auth } from "../../firebase"; //imports auth from firebase
import "./Register.css";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri"; //imports lock password icon from react-icons

//function to send custom email verifications
const sendVerificationEmail = async (email) => {
    const verificationLink = `http://your-frontend-url.com/verify?email=${email}`;

    try {
        //makes a post request to the backend to trigger email sending
        const response = await fetch("http://localhost:5000/send-verification-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, verificationLink }),
        });

        //failed to send error 
        if (!response.ok) {
            throw new Error("Failed to send verification email.");
        }
    } catch (error) {
        console.error("Error sending verification email:", error);
    }
};

//react component to handle user registration
const Register = () => {
    const [email, setEmail] = useState(""); //stores email
    const [password, setPassword] = useState(""); //stores password
    const [confirmPassword, setConfirmPassword] = useState(""); //confirm password match
    const [error, setError] = useState(""); //error/feedback message

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        //checks if password matches with confirm password
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            //creates user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            //send custom email notification
            await sendVerificationEmail(email);
            setError("A verification email has been sent.\nPlease check your inbox.");

            //clears input fields
            setEmail("");
            setPassword("");
            setConfirmPassword("");

        } catch (err) {
            setError("Error creating account. Try again.");
        }
    };

    return (
        <div className="register-container">  {/*The below code is the ui for the register page*/}
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
