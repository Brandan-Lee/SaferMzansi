const express = require("express");
const router = express.Router();
const { sendOtpEmail, verifyOtpCode } = require("../services/OtpService");
const { updateUserVerificationInSupabase } = require("../services/UserService");
const { validateBody } = require("../middleware/ValidateRequest");

const REQUIRED_SEND_OTP_FIELDS = ["email"];

const REQUIRED_VERIFY_OTP_FIELDS = ["email", "otp"];

const handleOtpError = (res, error, actionMessage) => {
	console.error(`Error during ${actionMessage}. Please try again`);
	return res.status(500).json({
		success: false,
		error: error?.message || `Error occurred while ${actionMessage}`,
	});
};

//Post call to send the OTP code to the user via email
router.post(
	"/send-otp-email",
	validateBody(REQUIRED_SEND_OTP_FIELDS),
	async (req, res) => {
		try {
			//Retrieve the email from the request
			const sanitizedEmail = req.body.email.trim().toLowerCase();
			await sendOtpEmail(sanitizedEmail);

			return res.status(200).json({
				success: true,
				message: "Verification OTP sent successfully",
			});
		} catch (error) {
			return handleOtpError(res, error, "sending OTP email");
		}
	},
);

router.post(
	"/verify-otp",
	validateBody(REQUIRED_VERIFY_OTP_FIELDS),
	async (req, res) => {
		try {
			const { email, otp } = req.body;
			const sanitizedEmail = email.trim().toLowerCase();
			const result = await verifyOtpCode(sanitizedEmail, otp);

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
			});
		} catch (error) {
			return handleOtpError(res, error, "verifying OTP");
		}
	}
);

module.exports = router;
