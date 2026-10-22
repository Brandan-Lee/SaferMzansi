const nodemailer = require("nodemailer");

const port =
	Number.parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 587;

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.sendgrid.net",
	port,
	secure: port === 465,
	connectionTimeout: 10000,
	greetingTimeout: 10000,
	socketTimeout: 15000,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

// Both email services use the same connection settings and mail transport.
const sendMail = (message) => transporter.sendMail(message);

module.exports = { sendMail };
