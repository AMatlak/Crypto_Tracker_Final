const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

//initialize firebase admin sdk
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

//nodemailer transporter setup for username and password from .env file
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

app.post("/send-verification-email", async (req, res) => {
    const { email, verificationLink } = req.body;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Verify Your Email for Crypto Tracker",
        html: `
            <h2>Welcome to Crypto Tracker!</h2>
            <p>Click the link below to verify your email. You can enable 2FA through dashboard settings:</p>
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

//generates 2FA qr code
app.post("/generate-2fa", async (req, res) => {
    const { email } = req.body;

    try {
        const secret = speakeasy.generateSecret({ length: 20 });
        const otpauthUrl = secret.otpauth_url;

        qrcode.toDataURL(otpauthUrl, async (err, qrCode) => {
            if (err) {
                return res.status(500).json({ error: "Failed to generate QR code" });
            }

            await db.collection("users").doc(email).set({ mfaEnabled: true, secret: secret.base32 }, { merge: true });
            res.json({ secret: secret.base32, qrCode });
        });
    } catch (error) {
        console.error("Error generating 2FA secret:", error);
        res.status(500).json({ error: "Failed to generate 2FA key." });
    }
});

//verify 2fa code
app.post("/verify-2fa", async (req, res) => {
    const { email, token } = req.body;

    try {
        const userDoc = await db.collection("users").doc(email).get();
        if (!userDoc.exists || !userDoc.data().mfaEnabled) {
            return res.status(400).json({ success: false, message: "2FA is not enabled for this user." });
        }

        const verified = speakeasy.totp.verify({
            secret: userDoc.data().secret,
            encoding: "base32",
            token,
            window: 1,
        });

        if (verified) {
            res.json({ success: true, message: "2FA Verified Successfully!" });
        } else {
            res.json({ success: false, message: "Invalid Code. Please try again." });
        }
    } catch (error) {
        console.error("Error verifying 2FA:", error);
        res.status(500).json({ error: "Failed to verify 2FA code." });
    }
});

//disable 2fa allows user to disabled 2fa 
app.post("/disable-2fa", async (req, res) => {
    const { email } = req.body;

    try {
        await db.collection("users").doc(email).update({ mfaEnabled: false, secret: admin.firestore.FieldValue.delete() });
        res.json({ success: true, message: "2FA Disabled Successfully!" });
    } catch (error) {
        console.error("Error disabling 2FA:", error);
        res.status(500).json({ error: "Failed to disable 2FA." });
    }
});

//checks if 2fa is enabled
app.post("/check-2fa", async (req, res) => {
    const { email } = req.body;

    try {
        const userDoc = await db.collection("users").doc(email).get();
        if (userDoc.exists && userDoc.data().mfaEnabled) {
            res.json({ mfaEnabled: true });
        } else {
            res.json({ mfaEnabled: false });
        }
    } catch (error) {
        console.error("Error checking 2FA status:", error);
        res.status(500).json({ error: "Failed to check 2FA status." });
    }
});

//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});