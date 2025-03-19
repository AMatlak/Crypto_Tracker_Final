const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

//set up nodemailer transport
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL, //username stored in .env file
        pass: process.env.PASSWORD, //password stored in .env file
    },
});

//email verification api
app.post("/send-verification-email", async (req, res) => {
    const { email, verificationLink } = req.body;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Verify Your Email for Crypto Tracker",
        html: `
            <h2>Welcome to Crypto Tracker!</h2>
            <p>Click the link below to verify your email you can enable 2FA through dashboard settings:</p>
            <a href="${verificationLink}" target="_blank">${verificationLink}</a>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Verification email sent successfully." });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send verification email." });
    }
});

//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
