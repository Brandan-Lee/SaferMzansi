const { sendMail: deliverMail } = require("#utils/mailTransport.js");

const escapeHtml = (value) =>
	String(value).replace(/[&<>"']/g, (character) => {
		const escaped = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		};
		return escaped[character];
	});

const emergencyEmailHtml = (message) => `
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9FAFB;font-family:Arial,sans-serif;color:#374151;padding:24px 12px">
		<tr><td align="center">
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:420px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:28px 24px">
				<tr><td align="center" style="padding-bottom:20px">
					<div style="font-size:20px;font-weight:700;color:#6B21A8">SaferMzansi Emergency Alert</div>
				</td></tr>
				<tr><td align="center" style="padding:12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;color:#B91C1C;font-size:14px;font-weight:700">
					An emergency alert was triggered
				</td></tr>
				<tr><td style="padding-top:20px;font-size:15px;line-height:1.6;color:#374151">
					${escapeHtml(message).replace(/\n/g, "<br>")}
				</td></tr>
				<tr><td style="padding-top:24px;font-size:12px;line-height:1.5;color:#6B7280">
					This message was sent by SaferMzansi. Contact the sender or local emergency services if immediate help is needed.
				</td></tr>
			</table>
		</td></tr>
	</table>
`;

const sendEmail = async ({ to, subject, text, html }) => {
	try {
		const info = await deliverMail({
			from: `"${process.env.FROM_NAME || "SaferMzansi Emergency Alert"}" <${process.env.FROM_EMAIL || process.env.SMTP_FROM || "alert@safermzansi.com"}>`,
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

module.exports = { sendEmail, emergencyEmailHtml };
