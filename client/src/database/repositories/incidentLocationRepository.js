import * as Crypto from "expo-crypto";
import { logLocalTable } from "@database/logLocalTable";

export const logLocalIncidentLocations = (db) =>
	logLocalTable(db, "Local_Incident_Locations");

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
