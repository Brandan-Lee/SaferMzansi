const { supabase } = require("#config/supabase_db.js");

const insertIncident = async (payload) => {
	const cleanPayload = Object.fromEntries(
		Object.entries(payload).filter(
			([key, value]) =>
				key !== "is_live_sharing" &&
				value !== undefined &&
				(key === "evidence_id" || value !== null),
		),
	);

	const { data, error } = await supabase
		.from("Incident")
		.upsert([cleanPayload], { onConflict: "incident_id" })
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data;
};

const getIncidentsByUserId = async (userId) => {
	if (!userId) {
		throw new Error("getIncidentsByUserId requires a valid user_id");
	}

	const safeUserId = String(userId).trim();

	const { data: incidentsList, error } = await supabase
		.from("Incident")
		.select("*")
		.eq("user_id", safeUserId);

	if (error) {
		throw error;
	}

	return incidentsList || [];
};

module.exports = {
	insertIncident,
	getIncidentsByUserId,
};
