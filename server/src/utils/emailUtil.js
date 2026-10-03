const nodemailer = require("nodemailer");

const port = parseInt(process.env.SMTP_PORT, 10) || 587;

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: port,
	secure: port === 465,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

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

const sendMail = async ({ to, subject, html }) => {
	const mailOptions = {
		from: `${process.env.FROM_NAME || "SaferMzansi"} <${process.env.FROM_EMAIL}>`,
		to,
		subject,
		html,
	};
	return transporter.sendMail(mailOptions);
};

module.exports = {
	sendMail,
	generateOtpEmailHTML,
};
