const express = require("express");

const router = express.Router();
const { sendOtp, verifyOtp } = require("#controllers/otpController.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_SEND_OTP_FIELDS = ["email"];
const REQUIRED_VERIFY_OTP_FIELDS = ["email", "otp"];

router.post("/send-otp-email", validateBody(REQUIRED_SEND_OTP_FIELDS), sendOtp);

router.post("/verify-otp", validateBody(REQUIRED_VERIFY_OTP_FIELDS), verifyOtp);

module.exports = router;
