const { supabase } = require("#config/supabase_db.js");
const { omitNullish } = require("#utils/databaseUtil.js");

const TABLE_NAME = "Incident_Location";

const upsertLocation = async (payload) => {
	const coordinates = payload.coordinates ?? {
		type: "Point",
		coordinates: [payload.longitude, payload.latitude],
	};
	const cleanPayload = omitNullish(payload);
	delete cleanPayload.latitude;
	delete cleanPayload.longitude;
	delete cleanPayload.updated_at;
	delete cleanPayload.is_deleted;
	cleanPayload.coordinates = coordinates;

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.upsert([cleanPayload], { onConflict: "location_id" })
		.select()
		.single();

	if (error) throw error;
	return data;
};

const getLocationsByIncidentId = async (incidentId) => {
	const query = supabase.from(TABLE_NAME).select("*");
	const { data, error } = Array.isArray(incidentId)
		? await query.in("incident_id", incidentId)
		: await query.eq("incident_id", incidentId);

	if (error) throw error;
	return data || [];
};

module.exports = { upsertLocation, getLocationsByIncidentId };
