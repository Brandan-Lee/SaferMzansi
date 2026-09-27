const crypto = require("crypto");
const nodemailer = require("nodemailer");

const otpStore = new Map();
const port = parseInt(process.env.SMTP_PORT, 10) || 587;

// Create a transporter to send the email to the user
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: port,
	secure: port === 465,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

// Helper method to sanitize the email
const sanitizeEmail = (email) =>
	email ? String(email).trim().toLowerCase() : "";

// Helper method to build the success response
const buildResponse = (success, status, message) => ({
	success,
	status,
	message,
});

// Method to generate the HTML message that will be used in the email
const generateOtpEmailHTML = (otp) => `
	<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
		<h2>SaferMzansi Verification Code</h2>
		<p>Please use the following code to complete your verification:</p>
		<h1 style="color: #6B21A8; letter-spacing: 4px;">${otp}</h1>
		<p>
			This code will expire in <strong>5 minutes</strong>.
		</p>
	</div>
`;

// Periodic background cleanup interval for expired OTPs
setInterval(
	() => {
		const now = Date.now();

		for (const [key, record] of otpStore.entries()) {
			if (now > record.expiresAt) {
				otpStore.delete(key);
			}
		}
	},
	5 * 60 * 1000,
);

// Method to send an OTP to the user's email
const sendOtpEmail = async (email) => {
	const sanitizedEmail = sanitizeEmail(email);

	if (!sanitizedEmail) {
		return buildResponse(false, 400, "Email is required");
	}

	// Generate 6-digit OTP
	const otp = crypto.randomInt(100000, 999999).toString();
	// OTP lives for 5 minutes
	const expiresAt = Date.now() + 5 * 60 * 1000;

	// Store OTP using the sanitized email string variable as the key
	otpStore.set(sanitizedEmail, { otp, expiresAt });

	const mailOptions = {
		from: `${process.env.FROM_NAME || "SaferMzansi"} <${process.env.FROM_EMAIL}>`,
		to: sanitizedEmail,
		subject: `Your SaferMzansi Verification Code`,
		text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
		html: generateOtpEmailHTML(otp),
	};

	try {
		await transporter.sendMail(mailOptions);
		return buildResponse(true, 200, "OTP sent successfully");
	} catch (error) {
		console.error("Failed to send OTP:", error.message);
		throw error;
	}
};

// Method that verifies the OTP received from the client
const verifyOtpCode = async (email, otp) => {
	const key = sanitizeEmail(email);
	const receivedOtp = otp ? String(otp).trim() : "";
	const record = otpStore.get(key);

	// OTP doesn't exist
	if (!record) {
		return buildResponse(false, 400, "No OTP found for this email address");
	}

	// Verify if the OTP code has expired or not
	if (Date.now() > record.expiresAt) {
		otpStore.delete(key);
		return buildResponse(
			false,
			400,
			"OTP has expired. Please request a new one and try again",
		);
	}

	// OTP received is not the same as the OTP stored in the map
	if (record.otp !== receivedOtp) {
		return buildResponse(false, 400, "Invalid OTP. Please try again");
	}

	// Clean up stored OTP after successful verification
	otpStore.delete(key);

	return buildResponse(true, 200, "OTP verified successfully.");
};

module.exports = { sendOtpEmail, verifyOtpCode };
