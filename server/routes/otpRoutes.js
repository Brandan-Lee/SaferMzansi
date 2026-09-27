const express = require("express");
const router = express.Router();
const { sendOtpEmail, verifyOtpCode } = require("../services/OtpService");
const { updateUserVerificationInSupabase } = require("../services/UserService");

//Post call to send the OTP code to the user via email
router.post("/send-otp-email", async (req, res) => {
    try {
        //Retrieve the email from the request
        const { email } = req.body;

        //Validate the email
        if (!email || !email.trim()) {  
            return res.status(400).json({
                error: "Email address is required"
            });
        }

        const sanitizedEmail = email.trim().toLowerCase();

        //User OTP service method to send the OTP via email
        await sendOtpEmail(sanitizedEmail);
        //OTP has been sent successfully
        return res.status(200).json({
            success: true,
            message: "Verification OTP sent successfully",
        });
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return res.status(500).json({
            error: "Failed to send verification email. Please try again later.",
        });
    }
});

//Post call to verify the OTP and to update the verification status of the user in supabase
router.post("/verify-otp", async (req, res) => {
    try {
        //Retrieve the email, encrypted email and the otp from the request
        const { user_id, email, otp, } = req.body;
        console.log(email, otp, user_id);

        //Validate presence of both the email and the otp
        if (!email || !otp || !user_id) {
            return res.status(400).json({
                error: "Email, OTP and User ID are required"
            });
        }

        const sanitizedEmail = email.trim().toLowerCase();

        //Verify the OTP code with the OTP service
        const result = await verifyOtpCode(sanitizedEmail, otp);
        console.log(result, sanitizedEmail);
        
        //OTP coud not be verified
        if (!result.success) {
            return res.status(result.status).json({
                error: result.message
            });
        }

        //Update the user verification status in supabase
        await updateUserVerificationInSupabase(user_id);

        //Success on all operations
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            is_verified: true,
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({
            error: "An error occurred during verification. Please try again",
        });
    }
});

module.exports = router;