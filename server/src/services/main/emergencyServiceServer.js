const locationModel = require("#models/incidentLocationModel.js");
const incidentModel = require("#models/incidentModel.js");
const { sendEmail, emergencyEmailHtml } = require("#utils/emailProvider.js");

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

	const saveIncident = async () => {
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
			return true;
		} catch (error) {
			console.error("[Emergency Server] Failed to persist incident:", error);
			return false;
		}
	};
	const saveLocation = async () => {
		try {
			await locationModel.upsertLocation({
				location_id,
				incident_id,
				latitude: location.latitude,
				longitude: location.longitude,
				altitude: location.altitude,
				accuracy: location.accuracy,
			});
			return true;
		} catch (error) {
			console.error("[Emergency Server] Failed to persist incident location:", error);
			return false;
		}
	};

	let policeInfoText = "";
	if (nearest_police_station) {
		policeInfoText = `\n\nNearest Police Station: ${nearest_police_station.name} (Lat: ${nearest_police_station.lat}, Lon: ${nearest_police_station.lon})`;
	}

	const fullMessage = message + policeInfoText;

	const contactsWithEmail = emergencyContacts.filter((contact) => contact.email);
	const sendContactEmail = async (contact) => {
		try {
			await sendEmail({
				to: contact.email,
				subject: "🚨 URGENT: Emergency Alert Triggered",
				text: fullMessage,
				html: emergencyEmailHtml(fullMessage),
			});
			return true;
		} catch (contactError) {
			console.error(
				`[Emergency Server] Failed to email emergency contact ${contact.name || contact.id}:`,
				contactError,
			);
			return false;
		}
	};

	// Run independent server work together so emergency requests return sooner.
	const [incidentSaved, locationSaved, emailResults] = await Promise.all([
		saveIncident(),
		saveLocation(),
		Promise.all(contactsWithEmail.map(sendContactEmail)),
	]);
	const emailSuccessCount = emailResults.filter(Boolean).length;
	const emailFailureCount = emailResults.length - emailSuccessCount;
	const eligibleContactCount = contactsWithEmail.length;

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
