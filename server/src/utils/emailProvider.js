const nodemailer = require("nodemailer");

const port =
	parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 587;

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.sendgrid.net",
	port,
	secure: port === 465,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const sendEmail = async ({ to, subject, text, html }) => {
	try {
		const info = await transporter.sendMail({
			from: `"${process.env.FROM_NAME || "SaferMzansi Emergency Alert"}" <${
				process.env.FROM_EMAIL ||
				process.env.SMTP_FROM ||
				"alert@safermzansi.com"
			}>`,
			to,
			subject,
			text,
			html: html || `<p>${text.replace(/\n/g, "<br>")}</p>`,
		});

		console.log("[Email Service] Emergency alert email sent:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("[Email Service] Failed to send emergency email:", error);
		throw error;
	}
};

module.exports = { sendEmail };
