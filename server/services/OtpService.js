const crypto = require("crypto");
const nodemailer = require("nodemailer");

const otpStore = new Map();
const passwordResetTokenStore = new Map();
const otpRequestTimes = new Map();
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
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
const generateOtpEmailHTML = (otp) => {
	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F9FAFB; font-family: Arial, sans-serif; color: #374151;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="
                    max-width: 420px;
                    width: 100%;
                    background-color: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 32px 24px;
                ">
                    <tr>
                        <td align="center" style="padding-bottom: 16px;">
                            <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">
                                SaferMzansi Verification
                            </h2>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.4;">
                                Your verification code is:
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="padding: 0 5px;">
                                        <span style="font-size: 24px; font-weight: 700; color: #6B21A8;">${otp}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
					
					<tr>
						<td align="center">
							<p style="margin: 0; font-size: 13px; color: #474b53;">
								This code is valid for <strong>5 minutes</strong>.
							</p>
						</td>
					</tr>
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0; font-size: 13px; font-weight: 600;">
                                Do not share this code with anyone.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

const canRequestOtp = (email) => {
	const lastRequestedAt = otpRequestTimes.get(email);
	const now = Date.now();

	if (lastRequestedAt && now - lastRequestedAt < OTP_REQUEST_COOLDOWN_MS) {
		return false;
	}

	otpRequestTimes.set(email, now);
	return true;
};

const createOtpMailOptions = (email, purpose = "verification", userId = null) => {
	const sanitizedEmail = sanitizeEmail(email);
	const otp = crypto.randomInt(100000, 1000000).toString();

	otpStore.set(sanitizedEmail, {
		otp,
		expiresAt: Date.now() + 5 * 60 * 1000,
		purpose,
		userId,
	});

	return {
		from: `${process.env.FROM_NAME || "SaferMzansi"} <${process.env.FROM_EMAIL}>`,
		to: sanitizedEmail,
		subject: "Your SaferMzansi Verification Code",
		html: generateOtpEmailHTML(otp),
	};
};

// Periodic background cleanup interval for expired OTPs
setInterval(
	() => {
		const now = Date.now();

		for (const [key, record] of otpStore.entries()) {
			if (now > record.expiresAt) {
				otpStore.delete(key);
			}
		}

		for (const [key, record] of passwordResetTokenStore.entries()) {
			if (now > record.expiresAt) {
				passwordResetTokenStore.delete(key);
			}
		}

		for (const [key, requestedAt] of otpRequestTimes.entries()) {
			if (now - requestedAt >= OTP_REQUEST_COOLDOWN_MS) {
				otpRequestTimes.delete(key);
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

	if (!canRequestOtp(sanitizedEmail)) {
		return buildResponse(false, 429, "Please wait before requesting another code");
	}

	const mailOptions = createOtpMailOptions(sanitizedEmail);

	try {
		await transporter.sendMail(mailOptions);
		return buildResponse(true, 200, "OTP sent successfully");
	} catch (error) {
		console.error("Failed to send OTP:", error.message);
		throw error;
	}
};

const queueOtpEmail = (email, userId) => {
	const sanitizedEmail = sanitizeEmail(email);

	if (!sanitizedEmail || !userId) {
		throw new Error("Email and user ID are required to send a password reset OTP");
	}

	if (!canRequestOtp(sanitizedEmail)) {
		return;
	}

	const mailOptions = createOtpMailOptions(
		sanitizedEmail,
		"password_reset",
		userId,
	);
	setImmediate(() => {
		transporter.sendMail(mailOptions).catch((error) => {
			console.error("Failed to send password reset OTP:", error.message);
			otpStore.delete(sanitizedEmail);
		});
	});
};

// Method that verifies the OTP received from the client
const verifyOtpCode = async (email, otp, purpose = "verification") => {
	const key = sanitizeEmail(email);
	const receivedOtp = otp ? String(otp).trim() : "";
	const record = otpStore.get(key);

	// OTP doesn't exist
	if (!record || record.purpose !== purpose) {
		return buildResponse(false, 400, "Invalid verification code or code expired");
	}

	// Verify if the OTP code has expired or not
	if (Date.now() > record.expiresAt) {
		otpStore.delete(key);
		return buildResponse(false, 400, "Invalid verification code or code expired");
	}

	// OTP received is not the same as the OTP stored in the map
	if (record.otp !== receivedOtp) {
		return buildResponse(false, 400, "Invalid verification code or code expired");
	}

	// Clean up stored OTP after successful verification
	otpStore.delete(key);

	if (purpose === "password_reset" && record.userId) {
		const resetToken = crypto.randomBytes(32).toString("hex");
		passwordResetTokenStore.set(resetToken, {
			userId: record.userId,
			expiresAt: Date.now() + 5 * 60 * 1000,
		});

		return {
			...buildResponse(true, 200, "OTP verified successfully."),
			resetToken,
		};
	}

	return buildResponse(true, 200, "OTP verified successfully.");
};

const isPasswordResetTokenValid = (resetToken, userId) => {
	const record = passwordResetTokenStore.get(resetToken);

	if (!record || record.userId !== userId || Date.now() > record.expiresAt) {
		if (record && Date.now() > record.expiresAt) {
			passwordResetTokenStore.delete(resetToken);
		}
		return false;
	}

	return true;
};

const consumePasswordResetToken = (resetToken, userId) => {
	if (!isPasswordResetTokenValid(resetToken, userId)) {
		return false;
	}

	passwordResetTokenStore.delete(resetToken);
	return true;
};

module.exports = {
	sendOtpEmail,
	queueOtpEmail,
	verifyOtpCode,
	isPasswordResetTokenValid,
	consumePasswordResetToken,
};
