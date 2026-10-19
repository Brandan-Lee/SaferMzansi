import * as Crypto from "expo-crypto";

const getTimeStamp = () =>
	new Date().toISOString().replace("T", " ").slice(0, 23);

const resolveCoordinates = ({ latitude, longitude, coordinates }) => {
	let point = coordinates;
	if (typeof point === "string") {
		try {
			point = JSON.parse(point);
		} catch {
			const match = point.match(
				/^POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i,
			);
			if (match) point = [Number(match[1]), Number(match[2])];
		}
	}

	if (Array.isArray(point)) {
		[longitude, latitude] = point;
	} else if (point && typeof point === "object") {
		const pointCoordinates = point.coordinates;
		if (Array.isArray(pointCoordinates)) {
			[longitude, latitude] = pointCoordinates;
		} else {
			latitude = point.latitude ?? latitude;
			longitude = point.longitude ?? longitude;
		}
	}

	const resolvedLatitude = Number(latitude);
	const resolvedLongitude = Number(longitude);
	if (
		latitude === null ||
		latitude === undefined ||
		longitude === null ||
		longitude === undefined ||
		!Number.isFinite(resolvedLatitude) ||
		!Number.isFinite(resolvedLongitude)
	) {
		throw new Error("Incident location is missing valid coordinates.");
	}

	return { latitude: resolvedLatitude, longitude: resolvedLongitude };
};

export const insertIncidentLocation = async (
	db,
	incidentId,
	locationData,
	locationId = Crypto.randomUUID(),
) => {
	const { latitude, longitude } = resolveCoordinates(locationData);
	const { altitude = null, accuracy = null } = locationData;
	const timeStamp = getTimeStamp();

	const query = `
        INSERT INTO Local_Incident_Locations (
            location_id,
            incident_id,
            latitude,
            longitude,
            altitude,
            accuracy,
            created_at,
            updated_at,
            is_deleted,
            is_synched
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0);
    `;

	await db.runAsync(query, [
		locationId,
		incidentId,
		latitude,
		longitude,
		altitude,
		accuracy,
		timeStamp,
		timeStamp,
	]);
	return locationId;
};

export const saveOrUpdateLocalIncidentLocation = async (
	db,
	incidentId,
	locationData,
	locationId = Crypto.randomUUID(),
) => {
	const {
		altitude = null,
		accuracy = null,
		isSynched = 0,
		isDeleted = 0,
	} = locationData;
	const { latitude, longitude } = resolveCoordinates(locationData);

	const timeStamp = getTimeStamp();

	const query = `
		INSERT INTO Local_Incident_Locations (
			location_id,
			incident_id,
			latitude,
			longitude,
			altitude,
			accuracy,
			created_at,
			updated_at,
			is_deleted,
			is_synched
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(location_id) DO UPDATE SET
			latitude = excluded.latitude,
			longitude = excluded.longitude,
			altitude = excluded.altitude,
			accuracy = excluded.accuracy,
			updated_at = excluded.updated_at,
			is_deleted = excluded.is_deleted,
			is_synched = excluded.is_synched;
	`;

	await db.runAsync(query, [
		locationId,
		incidentId,
		latitude,
		longitude,
		altitude,
		accuracy,
		timeStamp,
		timeStamp,
		isDeleted,
		isSynched,
	]);
	return locationId;
};

// Debugging helper to log Local Incident Locations database table
export const logLocalIncidentLocationsDatabase = async (db) => {
	try {
		const locations = await db.getAllAsync(
			"SELECT * FROM Local_Incident_Locations ORDER BY created_at DESC;",
		);
		console.log(
			"\n================ [SQLITE LOCAL INCIDENT LOCATIONS] ================",
		);
		if (!locations || locations.length === 0) {
			console.log("No location records found in Local_Incident_Locations.");
		} else {
			console.log(`Total Location Records: ${locations.length}\n`);
			locations.forEach((loc, index) => {
				console.log(`--- Location Record #${index + 1} ---`);
				console.log(JSON.stringify(loc, null, 2));
				console.log("----------------------------------------------------\n");
			});
		}
		console.log(
			"===================================================================\n",
		);
	} catch (error) {
		console.error("Failed to log Local_Incident_Locations database:", error);
	}
};
