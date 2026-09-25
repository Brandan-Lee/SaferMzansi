//Load environment variables at the top
require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const crypto = require("crypto");
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json()); //Email sending route requires body-parser to parse the request body
app.use(express.json());


const authRouter = require("./routes/auth");

app.use("/api/users", authRouter);

app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "SaferMzansi Node server running!" });
});

//---Store OTPs in memory for demonstration purposes. Considering using a database or cache.---
const otpStore = {};


// For sending emails
app.post("/api/send-otp-email", (req, res) => {
	const { email } = req.body; //Create a transporter object using the default SMTP transport

	if (!email) {
		//Need to make it look better
		return res.status(400).send("Email is required");
	}

	//Generate a 6-digit OTP and set an expiration time
	const otp = crypto.randomInt(100000, 999999).toString();
	const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes



	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT || 587, // Default to 587 if not specified
		secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports

		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS
		}
	});

	//Store OTP with email as key
	otpStore[email] = { otp, expiresAt };

	//Change message to contain the OTP
	const mailOptions = {
		from: process.env.FROM_NAME + ' <' + process.env.FROM_EMAIL + '>',
		to: email,
		subject: `This is a test email from SaferMzansi`,
		text: `Your OTP is: ${otp}. It will expire in 5 minutes.`
	}

	transporter.sendMail(mailOptions, (error) => {
		if (error) {
			//Change however you want to handle the error back to the client
			console.error('Error sending email:', error);
			res.status(500).send('Error sending email');
		}

		//Change however you want to handle the success back to the client
		console.log('Email sent successfully!');
		return res.status(200).send('Email sent successfully!');

	});
});

// For verifying OTP
app.post("/api/verify-otp", (req, res) => {

	const { email, otp } = req.body;
	const record = otpStore[email];

	//all return statements should be changed to send a more user-friendly message back to the client, and also handle the error in the client side

	if (!record) {
		return res.status(400).json({ message: "No OTP found for this email." });
	}

	if (record.otp !== otp) {
		return res.status(400).json({ message: "Invalid OTP." });
	}

	if (new Date() > record.expiresAt) {
		return res.status(400).json({ message: "OTP has expired." });
	}

	// Remove the OTP from the store after successful verification
	delete otpStore[email];

	return res.status(200).json({ message: "OTP verified successfully." });

});




app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://localhost:${PORT}`);
});