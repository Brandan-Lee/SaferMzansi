import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "@components/layouts/MainLayout";
import { useSQLiteContext } from "expo-sqlite";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import { useAuth } from "@context/AuthContext";
import { deleteEmergencyContact } from "@services/main/contactService";

const PURPLE = "#5E0A9E";

const ContactDetailsScreen = ({ navigation, route }) => {
	// const navigation = useNavigation();
	// const route = useRoute();
	const contact = route.params?.contact;
	const db = useSQLiteContext();
	const [banner, setBanner] = useState(null);
	const [modalConfig, setModalConfig] = useState({
		visible: false,
		title: "",
		message: "",
		confirmLabel: "Confirm",
		cancelLabel: "Cancel",
		isDestructive: false,
		iconName: "alert-circle-outline",
		onConfirm: () => {},
	});
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);

	if (!contact) {
		return (
			<MainLayout title="Contact details" onBack={() => navigation.goBack()}>
				<Text style={styles.empty}>Contact not found.</Text>
			</MainLayout>
		);
	}

	const firstName = contact.firstName || "";
	const surname = contact.surname || "";
	const fullName = `${firstName} ${surname}`.trim() || "Emergency Contact";

	const initials = [firstName, surname]
		.filter(Boolean)
		.map((w) => w[0].toUpperCase())
		.join("");

	const handleCall = () => {
		if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
	};

	const handleEmail = () => {
		if (contact.email) Linking.openURL(`mailto:${contact.email}`);
	};

	const hideModal = () => {
		setModalConfig((prev) => ({ ...prev, visible: false }));
	};

	const handleUpdate = () => {
		console.log("Update contact:", contact);
		navigation.navigate("EditContactScreen", { contact });
	};

	const handleDeleteContact = () => {
		setBanner(null);
		setModalConfig({
			visible: true,
			title: "Delete contact?",
			message:
				"Are you sure you want to delete this emergency contact? This action cannot be undone.",
			confirmLabel: "Delete",
			cancelLabel: "Cancel",
			isDestructive: true,
			iconName: "trash-outline",
			onConfirm: async () => {
				setIsLoading(true);
				const contactId = contact?.contactId || contact?.contact_id;
				const userId = user?.id || user?.userId || user?.user_id;

				const result = await deleteEmergencyContact(db, contactId, userId);

				if (!result.success) {
					setBanner({
						message: result?.error || "Failed to delete contact",
						type: "error",
					});
					return;
				}

				// Show success banner inside the open modal
				setBanner({
					message: "Emergency contact has been successfully removed.",
					type: "success",
				});

				// Hide modal and navigate away after 800ms
				setTimeout(() => {
					hideModal();
					setIsLoading(false);
					navigation.replace("EmergencyContactsScreen");
				}, 800);
			},
		});
	};

	const renderRow = (icon, label, value) => (
		<View style={styles.row}>
			<View style={styles.rowIcon}>
				<Ionicons name={icon} size={18} color={PURPLE} />
			</View>
			<View style={{ flex: 1 }}>
				<Text style={styles.rowLabel}>{label}</Text>
				<Text
					style={[styles.rowValue, !value && styles.rowValueEmpty]}
					numberOfLines={1}
				>
					{value || "Not provided"}
				</Text>
			</View>
		</View>
	);

	return (
		<MainLayout
			title="Contact details"
			onBack={() => navigation.replace("EmergencyContactsScreen")}
			tab="Contacts"
			navigation={navigation}
		>
			<ScrollView contentContainerStyle={styles.scroll}>
				<View style={styles.avatarFrame}>
					<View style={styles.avatar}>
						{initials ? (
							<Text style={styles.initials}>{initials}</Text>
						) : (
							<Ionicons name="person-outline" size={52} color={PURPLE} />
						)}
					</View>
				</View>
				<Text style={styles.fullName}>{fullName}</Text>

				{renderRow("person-outline", "Name", firstName)}
				{renderRow("people-outline", "Surname", surname)}
				{renderRow("call-outline", "Phone number", contact.phone)}
				{renderRow("mail-outline", "Email address", contact.email)}
			</ScrollView>

			<View style={styles.actions}>
				<View style={styles.actionRow}>
					<TouchableOpacity
						style={[styles.primaryButton, !contact.phone && styles.disabled]}
						activeOpacity={0.8}
						onPress={handleCall}
						disabled={!contact.phone}
					>
						<Ionicons name="call-outline" size={20} color="#fff" />
						<Text style={styles.primaryText}>Call</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.secondaryButton, !contact.email && styles.disabled]}
						activeOpacity={0.8}
						onPress={handleEmail}
						disabled={!contact.email}
					>
						<Ionicons name="mail-outline" size={20} color={PURPLE} />
						<Text style={styles.secondaryText}>Email</Text>
					</TouchableOpacity>
				</View>
				<TouchableOpacity
					style={[styles.editButton]}
					activeOpacity={0.8}
					onPress={handleUpdate}
				>
					<Ionicons name="create-outline" size={20} color="#fff" />
					<Text style={styles.primaryText}>Edit Contact</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.deleteButton]}
					activeOpacity={0.8}
					onPress={handleDeleteContact}
				>
					<Ionicons name="trash-outline" size={20} color="#fff" />
					<Text style={styles.primaryText}>Delete Contact</Text>
				</TouchableOpacity>
			</View>

			<ConfirmationModal
				visible={modalConfig.visible}
				title={modalConfig.title}
				message={modalConfig.message}
				confirmLabel={modalConfig.confirmLabel}
				cancelLabel={modalConfig.cancelLabel}
				isDestructive={modalConfig.isDestructive}
				iconName={modalConfig.iconName}
				loading={isLoading}
				onConfirm={modalConfig.onConfirm}
				onCancel={hideModal}
				banner={banner}
			/>
		</MainLayout>
	);
};

const styles = StyleSheet.create({
	scroll: { paddingBottom: 20 },
	empty: { textAlign: "center", color: "#555", fontSize: 16, marginTop: 40 },
	avatarFrame: {
		alignSelf: "center",
		padding: 2,
		marginTop: 8,
	},
	avatar: {
		width: 68,
		height: 68,
		borderRadius: 34,
		backgroundColor: "#EFE3FA",
		alignItems: "center",
		justifyContent: "center",
	},
	initials: { fontSize: 26, fontWeight: "700", color: PURPLE },
	fullName: {
		textAlign: "center",
		fontSize: 20,
		fontWeight: "700",
		color: "#111",
		marginTop: 10,
		marginBottom: 20,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 12,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1,
	},
	rowIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#EFE3FA",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	rowLabel: { fontSize: 12, color: "#666" },
	rowValue: { fontSize: 15, fontWeight: "600", color: "#111" },
	rowValueEmpty: { color: "#999", fontWeight: "400", fontStyle: "italic" },
	actions: { marginBottom: 20 },
	actionRow: { flexDirection: "row", gap: 12 },
	primaryButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: PURPLE,
		borderRadius: 8,
		paddingVertical: 12,
		gap: 8,
	},
	primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
	secondaryButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1.5,
		borderColor: PURPLE,
		borderRadius: 8,
		paddingVertical: 12,
		gap: 8,
	},
	secondaryText: { color: PURPLE, fontSize: 16, fontWeight: "600" },

	editText: { color: "#fff", fontSize: 16, fontWeight: "600" },
	editButton: {
		// remove flex: 1
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: PURPLE,
		borderWidth: 1.5,
		borderColor: PURPLE,
		borderRadius: 8,
		paddingVertical: 12,
		gap: 8,
		marginTop: 12,
	},
	deleteButton: {
		// remove flex: 1
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#ff3b3b",
		borderWidth: 1.5,
		borderColor: "#b30000",
		borderRadius: 8,
		paddingVertical: 12,
		gap: 8,
		marginTop: 12,
	},
	deleteText: { color: "#fff", fontSize: 16, fontWeight: "600" },
	disabled: { opacity: 0.4 },
});

export default ContactDetailsScreen;
