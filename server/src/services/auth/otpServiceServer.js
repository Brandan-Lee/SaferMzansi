const crypto = require("crypto");

const { sendMail, generateOtpEmailHTML } = require("#utils/emailUtil.js");

const otpStore = new Map();
const passwordResetTokenStore = new Map();
const otpRequestTimes = new Map();
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;

const sanitizeEmail = (email) =>
	email ? String(email).trim().toLowerCase() : "";

const buildResponse = (success, status, message) => ({
	success,
	status,
	message,
});

const canRequestOtp = (email) => {
	const lastRequestedAt = otpRequestTimes.get(email);
	const now = Date.now();

	if (lastRequestedAt && now - lastRequestedAt < OTP_REQUEST_COOLDOWN_MS) {
		return false;
	}

	otpRequestTimes.set(email, now);
	return true;
};

const createOtpMailOptions = (
	email,
	purpose = "verification",
	userId = null,
) => {
	const sanitizedEmail = sanitizeEmail(email);
	const otp = crypto.randomInt(100000, 999999).toString();

	otpStore.set(sanitizedEmail, {
		otp,
		expiresAt: Date.now() + 5 * 60 * 1000,
		purpose,
		userId,
	});

	return {
		to: sanitizedEmail,
		subject: "Your SaferMzansi Verification Code",
		html: generateOtpEmailHTML(otp),
	};
};

// Background cleanup interval for expired records
setInterval(
	() => {
		const now = Date.now();

		for (const [key, record] of otpStore.entries()) {
			if (now > record.expiresAt) otpStore.delete(key);
		}

		for (const [key, record] of passwordResetTokenStore.entries()) {
			if (now > record.expiresAt) passwordResetTokenStore.delete(key);
		}

		for (const [key, requestedAt] of otpRequestTimes.entries()) {
			if (now - requestedAt >= OTP_REQUEST_COOLDOWN_MS)
				otpRequestTimes.delete(key);
		}
	},
	5 * 60 * 1000,
);

const sendOtpEmail = async (email) => {
	const sanitizedEmail = sanitizeEmail(email);

	if (!sanitizedEmail) {
		return buildResponse(false, 400, "Email is required");
	}

	if (!canRequestOtp(sanitizedEmail)) {
		return buildResponse(
			false,
			429,
			"Please wait before requesting another code",
		);
	}

	const mailOptions = createOtpMailOptions(sanitizedEmail);

	try {
		await sendMail(mailOptions);
		return buildResponse(true, 200, "OTP sent successfully");
	} catch (error) {
		console.error("Failed to send OTP:", error.message);
		throw error;
	}
};

const queueOtpEmail = (email, userId) => {
	const sanitizedEmail = sanitizeEmail(email);

	if (!sanitizedEmail || !userId) {
		throw new Error(
			"Email and user ID are required to send a password reset OTP",
		);
	}

	if (!canRequestOtp(sanitizedEmail)) return;

	const mailOptions = createOtpMailOptions(
		sanitizedEmail,
		"password_reset",
		userId,
	);

	setImmediate(() => {
		sendMail(mailOptions).catch((error) => {
			console.error("Failed to send password reset OTP:", error.message);
			otpStore.delete(sanitizedEmail);
		});
	});
};

const verifyOtpCode = async (email, otp, purpose = "verification") => {
	const key = sanitizeEmail(email);
	const receivedOtp = otp ? String(otp).trim() : "";
	const record = otpStore.get(key);

	if (!record || record.purpose !== purpose) {
		return buildResponse(
			false,
			400,
			"Invalid verification code or code expired",
		);
	}

	if (Date.now() > record.expiresAt) {
		otpStore.delete(key);
		return buildResponse(
			false,
			400,
			"Invalid verification code or code expired",
		);
	}

	if (record.otp !== receivedOtp) {
		return buildResponse(
			false,
			400,
			"Invalid verification code or code expired",
		);
	}

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
