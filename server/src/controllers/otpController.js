const {
	sendOtpEmail,
	verifyOtpCode,
} = require("#services/auth/otpServiceServer.js");

const sendOtp = async (req, res) => {
	try {
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
	} catch (error) {
		console.error("Error during sending OTP email.", error);
		return res.status(500).json({
			success: false,
			error: error?.message || "Error occurred while sending OTP email",
		});
	}
};

const verifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;
		const sanitizedEmail = email.trim().toLowerCase();
		const purpose = req.body.purpose || "verification";

		const result = await verifyOtpCode(sanitizedEmail, otp, purpose);

		if (!result || !result.success) {
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
	} catch (error) {
		console.error("Error during verifying OTP.", error);
		return res.status(500).json({
			success: false,
			error: error?.message || "Error occurred while verifying OTP",
		});
	}
};

module.exports = {
	sendOtp,
	verifyOtp,
};
