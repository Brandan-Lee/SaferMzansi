// SQLite timestamps use sortable UTC text in the format YYYY-MM-DD HH:mm:ss.SSS.
export const getDatabaseTimestamp = () =>
	new Date().toISOString().replace("T", " ").slice(0, 23);
