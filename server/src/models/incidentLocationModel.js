const { supabase } = require("#config/supabase_db.js");

const upsertLocation = async (payload) => {
	const coordinates = payload.coordinates ?? {
		type: "Point",
		coordinates: [payload.longitude, payload.latitude],
	};
	const cleanPayload = Object.fromEntries(
		Object.entries(payload).filter(
			([key, value]) =>
				!["latitude", "longitude", "updated_at", "is_deleted"].includes(
					key,
				) &&
				value !== null &&
				value !== undefined,
		),
	);
	cleanPayload.coordinates = coordinates;

	const { data, error } = await supabase
		.from("Incident_Location")
		.upsert([cleanPayload], { onConflict: "location_id" })
		.select()
		.single();

	if (error) throw error;
	return data;
};

const getLocationsByIncidentId = async (incidentId) => {
	const query = supabase.from("Incident_Location").select("*");
	const { data, error } = Array.isArray(incidentId)
		? await query.in("incident_id", incidentId)
		: await query.eq("incident_id", incidentId);

	if (error) throw error;
	return data || [];
};

module.exports = { upsertLocation, getLocationsByIncidentId };
