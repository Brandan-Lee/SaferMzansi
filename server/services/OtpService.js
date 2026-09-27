const crypto = require("crypto");
const nodemailer = require("nodemailer");

const otpStore = new Map();
const port = parseInt(process.env.SMTP_PORT, 10) || 587;

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: port,
	secure: port === 465,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const sendOtpEmail = async (email) => {
	console.log("\n================ [OTP SERVICE: SEND] ================");
	console.log("1. Raw email received:", JSON.stringify(email));

	if (!email) {
		console.error("❌ Send failed: Email parameter is empty or undefined.");
		return { success: false, status: 400, statusCode: 400, message: "Email is required." };
	}

	const sanitizedEmail = String(email).trim().toLowerCase();
	console.log("2. Normalized storage key:", JSON.stringify(sanitizedEmail));

	const otp = crypto.randomInt(100000, 999999).toString();
	const expiresAt = Date.now() + 5 * 60 * 1000;

	console.log("3. Generated OTP:", otp, "| Expires at timestamp:", expiresAt);

	// Store OTP in Map
	otpStore.set(sanitizedEmail, { otp, expiresAt });
	console.log("4. Successfully stored in Map.");
	console.log("   Current Map Size:", otpStore.size);
	console.log("   Keys currently in Map:", Array.from(otpStore.keys()));

	const mailOptions = {
		from: `${process.env.FROM_NAME || "SaferMzansi"} <${process.env.FROM_EMAIL}>`,
		to: sanitizedEmail,
		subject: `Your SaferMzansi Verification Code`,
		text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
		html: `
			<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
				<h2>SaferMzansi Verification Code</h2>
				<p>Please use the following code to complete your verification:</p>
				<h1 style="color: #6B21A8; letter-spacing: 4px;">${otp}</h1>
				<p>This code will expire in <strong>5 minutes</strong>.</p>
			</div>
		`,
	};

	try {
		console.log("5. Attempting to dispatch email via Nodemailer...");
		await transporter.sendMail(mailOptions);
		console.log("6. Email successfully dispatched to:", sanitizedEmail);
		console.log("=====================================================\n");
		return { success: true, status: 200, statusCode: 200, message: "OTP sent successfully." };
	} catch (error) {
		console.error("❌ Nodemailer send failed:", error.message);
		console.log("=====================================================\n");
		throw error;
	}
};

const verifyOtpCode = async (email, otp) => {
	console.log("\n================ [OTP SERVICE: VERIFY] ================");
	console.log("1. Raw verification input -> Email:", JSON.stringify(email), "| Code:", JSON.stringify(otp));

	const key = email ? String(email).trim().toLowerCase() : "";
	const receivedOtp = otp ? String(otp).trim() : "";

	console.log("2. Normalized search key:", JSON.stringify(key));
	console.log("   Current Map Size:", otpStore.size);
	console.log("   Keys currently in Map:", Array.from(otpStore.keys()));

	const record = otpStore.get(key);
	console.log("3. Map Lookup Result:", record);

	if (!record) {
		console.error("❌ Verification Failed: Key not found in Map.");
		console.log("=======================================================\n");
		return {
			success: false,
			status: 400,
			statusCode: 400,
			message: "No OTP found for this email address.",
		};
	}

	const currentTime = Date.now();
	console.log("4. Time check -> Current:", currentTime, "| ExpiresAt:", record.expiresAt);

	if (currentTime > record.expiresAt) {
		console.error("❌ Verification Failed: OTP expired.");
		otpStore.delete(key);
		console.log("=======================================================\n");
		return {
			success: false,
			status: 400,
			statusCode: 400,
			message: "OTP has expired. Please request a new one.",
		};
	}

	console.log("5. Code check -> Stored OTP:", JSON.stringify(record.otp), "| Received OTP:", JSON.stringify(receivedOtp));

	if (record.otp !== receivedOtp) {
		console.error("❌ Verification Failed: Code mismatch.");
		console.log("=======================================================\n");
		return {
			success: false,
			status: 400,
			statusCode: 400,
			message: "Invalid OTP code. Please try again.",
		};
	}

	// Clean up stored OTP after successful verification
	otpStore.delete(key);
	console.log("6. Verification Successful! Deleted key from Map.");
	console.log("=======================================================\n");

	return {
		success: true,
		status: 200,
		statusCode: 200,
		message: "OTP verified successfully.",
	};
};

module.exports = { sendOtpEmail, verifyOtpCode };