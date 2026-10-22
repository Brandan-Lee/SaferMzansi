export const normalizeEmail = (email) =>
	String(email ?? "")
		.trim()
		.toLowerCase();

export const normalizeName = (name) => String(name ?? "").trim();

export const normalizePhone = (phone) =>
	String(phone ?? "").replace(/[\s-]/g, "");
