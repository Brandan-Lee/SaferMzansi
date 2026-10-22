const express = require("express");

const router = express.Router();
const { sendOtp, verifyOtp } = require("#controllers/otpController.js");
const asyncHandler = require("#middleware/asyncHandler.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_SEND_OTP_FIELDS = ["email"];
const REQUIRED_VERIFY_OTP_FIELDS = ["email", "otp"];

router.post(
	"/send-otp-email",
	validateBody(REQUIRED_SEND_OTP_FIELDS),
	asyncHandler(sendOtp),
);

router.post(
	"/verify-otp",
	validateBody(REQUIRED_VERIFY_OTP_FIELDS),
	asyncHandler(verifyOtp),
);

module.exports = router;
