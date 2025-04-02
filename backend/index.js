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

//sends email verification to the user
app.post("/send-verification-email", async (req, res) => {
    const { email, verificationLink } = req.body;

    //email content(how the user sees it)
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Verify Your Email for Crypto Tracker",
        html: `
            <h2>Welcome to Crypto Tracker Test!</h2>
            <p>Click the link below to verify your email. You can enable 2FA through dashboard settings:</p>
            <a href="${verificationLink}" target="_blank">${verificationLink}</a>
        `,
    };

    try {
        //sends email using nodemailer
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Verification email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send the verification email" });
    }
});

//generates 2FA secret and qr code
app.post("/generate-2fa", async (req, res) => {
    const { email } = req.body;

    try {
        //generates a 2FA secret and corresponding url
        const secret = speakeasy.generateSecret({ length: 20 });
        const otpauthUrl = secret.otpauth_url;

        //generates a qr code from the secret url
        qrcode.toDataURL(otpauthUrl, async (err, qrCode) => {
            if (err) {
                return res.status(500).json({ error: "Failed to generate QR code" });
            }

            //stores 2fa secret and status in firestore
            await db.collection("users").doc(email).set({ mfaEnabled: true, secret: secret.base32 }, { merge: true });

            //returns the secret and qr code to the frontend
            res.json({ secret: secret.base32, qrCode });
        });
    } catch (error) {
        console.error("Error generating 2FA secret", error);
        res.status(500).json({ error: "Failed to generate 2FA key" });
    }
});

//verify 2fa code
app.post("/verify-2fa", async (req, res) => {
    const { email, token } = req.body;

    try {
        //retrieves user documemnt from firestore
        const userDoc = await db.collection("users").doc(email).get();

        if (!userDoc.exists || !userDoc.data().mfaEnabled) {
            return res.status(400).json({ success: false, message: "2FA is not enabled for this user" });
        }

        //verifys token using speakeasy
        const verified = speakeasy.totp.verify({
            secret: userDoc.data().secret,
            encoding: "base32",
            token,
            window: 1,
        });

        if (verified) {
            res.json({ success: true, message: "2FA Verified Successfully" });
        } else {
            res.json({ success: false, message: "Invalid Code. Please try again" });
        }
    } catch (error) {
        console.error("Error verifying 2FA", error);
        res.status(500).json({ error: "Failed to verify 2FA  one time code" });
    }
});

//disable 2fa allows user to disabled 2fa 
app.post("/disable-2fa", async (req, res) => {
    const { email } = req.body;

    try {
        //updates firestore to disable 2fa and remove secret
        await db.collection("users").doc(email).update({ mfaEnabled: false, secret: admin.firestore.FieldValue.delete() });
        res.json({ success: true, message: "2FA Disabled Successfully!" });
    } catch (error) {
        console.error("Error disabling 2FA", error);
        res.status(500).json({ error: "Failed to disable 2FA." });
    }
});

//checks if 2fa is enabled
app.post("/check-2fa", async (req, res) => {
    const { email } = req.body;

    try {
        //retrieves user data from firestore
        const userDoc = await db.collection("users").doc(email).get();

        //returns 2fa status
        if (userDoc.exists && userDoc.data().mfaEnabled) {
            res.json({ mfaEnabled: true });
        } else {
            res.json({ mfaEnabled: false });
        }
    } catch (error) {
        console.error("Error checking 2FA status", error);
        res.status(500).json({ error: "Failed to check 2FA status." });
    }
});

//accepts price alert from frontend
app.post("/api/set-alert", async (req, res) => {
    const { cryptoId, targetPrice, email, currentPrice } = req.body;

    if (!cryptoId || !targetPrice || !email || !currentPrice) {
        return res.status(400).json({ message: "Missing alert data." });
    }
    const direction = parseFloat(targetPrice) > currentPrice ? "above" : "below";

    try {
        //stores the alert in firestore
        await db.collection("alerts").add({
            cryptoId,
            targetPrice: parseFloat(targetPrice),
            email,
            currentPrice: parseFloat(currentPrice),
            direction,
            notified: false,
            createdAt: new Date(),
        });

        //error checking/testing
        console.log(`Alert stored for ${email}: ${cryptoId} ${direction} $${targetPrice}`);
        res.status(200).json({ message: `Alert set for ${cryptoId} at $${targetPrice}` });
    } catch (error) {
        console.error("Failed to store alert", error);
        res.status(500).json({ message: "Failed to set alert" });
    }
});

//route to fetch all active alerts for displaying on table in analytics page
app.post("/api/get-alerts", async (req, res) => {
    const { email } = req.body;

    //validates email
    if (!email) {
        return res.status(400).json({ message: "Email is missing" });
    }

    try {
        //query sent to firestore for alerts matching the users email that have not yet been triggered
        const snapshot = await db.collection("alerts")
            .where("email", "==", email)
            .where("notified", "==", false)
            .get();

        const alerts = [];

        //formats the alerts documents into a clean array of alert objects
        snapshot.forEach(doc => {
            alerts.push({
                id: doc.id,
                cryptoId: doc.data().cryptoId,
                currentPrice: doc.data().currentPrice || 0,
                targetPrice: doc.data().targetPrice,
                direction: doc.data().direction
            });
        });

        //returns the list of alerts as a json
        res.status(200).json(alerts);
    } catch (err) {
        console.error("Error fetching the alerts", err);
        res.status(500).json({ message: "Failed to fetch the alerts" });
    }
});

//route to delete an alert by its firestore id linked to the remove button on analytics page
app.delete("/api/delete-alert", async (req, res) => {
    const { id } = req.body;

    //validates id
    if (!id) {
        return res.status(400).json({ message: "Missing the alert ID" });
    }

    try {
        //deletes the alert document from firestore
        await db.collection("alerts").doc(id).delete();

        //responds with a success message
        res.status(200).json({ message: "Alert deleted successfully" });
    } catch (error) {
        console.error("Failed to delete alert", error);
        res.status(500).json({ message: "Failed to delete alert" });
    }
});

//axios is used to fetch current crypto prices from coingecko api
const axios = require("axios");

//checks alerts and sends email if target is hit (only once)
const checkPriceAlerts = async () => {
    try {
        //retrieves all active alerts from firestore
        const snapshot = await db.collection("alerts").where("notified", "==", false).get();

        if (snapshot.empty) {
            console.log("No active alerts not calling api");
            return;
        }

        const alerts = [];
        const cryptoIds = new Set();

        //formats firestore data
        snapshot.forEach(doc => {
            const alert = { id: doc.id, ...doc.data() };
            alerts.push(alert);
            cryptoIds.add(alert.cryptoId);
        });

        //fetches current prices from coingecko
        const idsQuery = [...cryptoIds].join(',');
        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${idsQuery}&vs_currencies=usd`);

        //loops through alerts to check if target is hit
        for (const alert of alerts) {
            const currentPrice = data[alert.cryptoId]?.usd;
            if (currentPrice === undefined) continue;

            //handles both above and below price alerts
            if (
                (alert.direction === "above" && currentPrice >= alert.targetPrice) ||
                (alert.direction === "below" && currentPrice <= alert.targetPrice)
            ) {
                //email content when alert is triggered
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: alert.email,
                    subject: `Crypto Alert: ${alert.cryptoId} hit $${currentPrice}`,
                    html: `
                        <h2>Price Alert Triggered</h2>
                        <p>${alert.cryptoId} has ${
                            alert.direction === "above" ? "risen above" : "dropped below"
                        } your target of <strong>$${alert.targetPrice}</strong>.</p>
                        <p>Current price: <strong>$${currentPrice}</strong></p>
                    `,
                };

                try {
                    //sends email to user and updates firestore alert as triggered
                    //also console log is for testing to make sure its working
                    await transporter.sendMail(mailOptions);
                    await db.collection("alerts").doc(alert.id).update({ notified: true });
                    console.log(`Alert email sent to ${alert.email} for ${alert.cryptoId}`);
                } catch (err) {
                    console.error(`Failed to send alert email to ${alert.email}`, err);
                }
            }
        }
    } catch (error) {
        console.error("error checking alerts", error);
    }
};

//checks alerts every 2 minutes
setInterval(checkPriceAlerts, 2 * 60 * 1000);

//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});