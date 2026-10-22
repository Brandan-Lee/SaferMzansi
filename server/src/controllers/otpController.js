const {
	sendOtpEmail,
	verifyOtpCode,
} = require("#services/auth/otpServiceServer.js");

const sendOtp = async (req, res) => {
	const sanitizedEmail = req.body.email.trim().toLowerCase();
	const result = await sendOtpEmail(sanitizedEmail);

	if (!result.success) {
		return res.status(result.status || 400).json({
			success: false,
			error: result.message,
		});
	}

	return res.status(200).json({
		success: true,
		message: "Verification OTP sent successfully",
	});
};

const verifyOtp = async (req, res) => {
	const { email, otp } = req.body;
	const sanitizedEmail = email.trim().toLowerCase();
	const purpose = req.body.purpose || "verification";
	const result = await verifyOtpCode(sanitizedEmail, otp, purpose);

	if (!result?.success) {
		return res.status(result?.status || 400).json({
			success: false,
			error: result?.message || "Invalid OTP code",
		});
	}

	return res.status(200).json({
		success: true,
		message: "OTP verified successfully",
		is_verified: true,
		...(result.resetToken && { reset_token: result.resetToken }),
	});
};

module.exports = {
	sendOtp,
	verifyOtp,
};
