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
