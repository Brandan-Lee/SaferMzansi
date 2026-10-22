// Supabase rejects null values inconsistently across columns; omit unset fields.
const omitNullish = (record) =>
	Object.fromEntries(
		Object.entries(record).filter(
			([, value]) => value !== null && value !== undefined,
		),
	);

module.exports = { omitNullish };
