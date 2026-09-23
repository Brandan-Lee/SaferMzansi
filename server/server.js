//Load environment variables at the top
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

//NodeMailer for sending emails
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

app.use(cors());
app.use(express.json());

//Sample Health Check Route
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "SaferMzansi Node server running!" });
});

// server.js
app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

const otpCache = {};

//configure nodemailer transporter
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

app.post("/api/send-otp", async (req, res) => {
	const { email } = req.body;
	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
	const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

	otpCache[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes

	const mailOptions = {
		from: process.env.FROM_NAME,
		to: email,
		subject: "Your OTP Code",
		text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
	};

	try {
		await transporter.sendMail(mailOptions);
		res.json({ message: "OTP sent successfully" });
	} catch (error) {
		console.error("Error sending OTP email:", error);
		res.status(500).json({ error: "Failed to send OTP" });
	}
});

app.post("/api/verify-otp", (req, res) => {
	const { email, otp } = req.body;
	const record = otpCache[email];

	if (!record) {
		return res.status(400).json({ error: "No OTP found for this email" });
	}

	if (Date.now() > record.expiresAt) {
		delete otpCache[email];
		return res.status(400).json({ error: "OTP has expired" });
	}

	if (record.otp === otp) {
		delete otpCache[email]; // Remove OTP after successful verification
		return res.json({ message: "OTP verified successfully" });
	} else {
		return res.status(400).json({ error: "Invalid OTP" });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
