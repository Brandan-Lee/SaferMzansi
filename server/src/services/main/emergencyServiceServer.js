const { sendEmail } = require("#utils/emailProvider.js");
const incidentModel = require("#models/incidentModel.js");
const locationModel = require("#models/incidentLocationModel.js");

const handleEmergencyBroadcast = async (payload) => {
	const {
		incident_id,
		location_id,
		user_id,
		trigger_type,
		status,
		start_time,
		tracking_token,
		location,
		contacts,
		nearest_police_station,
		message,
	} = payload;

	const emergencyContacts = Array.isArray(contacts) ? contacts : [];

	let incidentSaved = false;
	let locationSaved = false;
	try {
		await incidentModel.insertIncident({
			incident_id,
			user_id,
			evidence_id: null,
			trigger_type,
			status,
			start_time,
			tracking_token,
		});
		incidentSaved = true;
	} catch (error) {
		console.error("[Emergency Server] Failed to persist incident:", error);
	}

	try {
		await locationModel.upsertLocation({
			location_id,
			incident_id,
			latitude: location.latitude,
			longitude: location.longitude,
			altitude: location.altitude,
			accuracy: location.accuracy,
		});
		locationSaved = true;
	} catch (error) {
		console.error(
			"[Emergency Server] Failed to persist incident location:",
			error,
		);
	}

	let policeInfoText = "";
	if (nearest_police_station) {
		policeInfoText = `\n\nNearest Police Station: ${nearest_police_station.name} (Lat: ${nearest_police_station.lat}, Lon: ${nearest_police_station.lon})`;
	}

	const fullMessage = message + policeInfoText;

	let emailSuccessCount = 0;
	let emailFailureCount = 0;
	let eligibleContactCount = 0;

	for (const contact of emergencyContacts) {
		if (!contact.email) continue;
		eligibleContactCount++;
		try {
			await sendEmail({
				to: contact.email,
				subject: "🚨 URGENT: Emergency Alert Triggered",
				text: fullMessage,
			});
			emailSuccessCount++;
		} catch (contactError) {
			emailFailureCount++;
			console.error(
				`[Emergency Server] Failed to email emergency contact ${contact.name || contact.id}:`,
				contactError,
			);
		}
	}

	return {
		incident_id,
		incident_saved: incidentSaved,
		location_saved: locationSaved,
		contacts_with_email: eligibleContactCount,
		contacts_without_email: emergencyContacts.length - eligibleContactCount,
		emails_sent: emailSuccessCount,
		emails_failed: emailFailureCount,
		police_station_included: !!nearest_police_station,
		...(eligibleContactCount === 0
			? { warning: "No emergency contact email addresses were provided." }
			: {}),
	};
};

module.exports = {
	handleEmergencyBroadcast,
};
