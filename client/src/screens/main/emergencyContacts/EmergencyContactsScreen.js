import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@context/AuthContext";
import ContactCard from "@components/cards/ContactCard";
import MainLayout from "@components/layouts/MainLayout";
import { getEmergencyContacts } from "@services/main/contactService";

const PURPLE = "#5E0A9E";

export default function EmergencyContactsScreen({ navigation }) {
	const db = useSQLiteContext();
	const route = useRoute();
	const { user } = useAuth();
	const userId = route.params?.userId || user?.userId;
	const [banner, setBanner] = useState(null);

	const [contacts, setContacts] = useState([]);
	const [loading, setLoading] = useState(true);

	const loadContacts = useCallback(async () => {
		if (!db || !userId) return setLoading(false);
		try {
			setLoading(true);
			const res = await getEmergencyContacts(db, userId);

			// Safely set array directly
			setContacts(Array.isArray(res?.contacts) ? res.contacts : []);
		} catch (error) {
			console.error("Failed to load emergency contacts:", error);
			setContacts([]);
		} finally {
			setLoading(false);
		}
	}, [db, userId]);

	useFocusEffect(
		useCallback(() => {
			loadContacts();
		}, [loadContacts])
	);

	const getItemKey = (item, index) =>
		item.contactId?.toString() ||
		item.contact_id?.toString() ||
		item.id?.toString() ||
		index.toString();

	return (
		<MainLayout
			title="Emergency contacts"
			onBack={() => navigation.goBack()}
			banner={banner}
			tab="Contacts"
			navigation={navigation}
			actionButton={{
				label: "Add contact",
				icon: "person-add-outline",
				onPress: () =>
					navigation.replace("AddContactScreen", { userId: user?.userId }),
			}}
		>
			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" color={PURPLE} />
				</View>
			) : (
				<FlatList
					data={contacts}
					keyExtractor={getItemKey}
					renderItem={({ item }) => (
						<ContactCard
							item={item}
							onPress={() =>
								navigation.replace("ContactDetailsScreen", {
									contact: item,
									userId,
								})
							}
						/>
					)}
					contentContainerStyle={styles.list}
					ListEmptyComponent={
						<Text style={styles.empty}>No emergency contacts added yet.</Text>
					}
				/>
			)}
		</MainLayout>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	list: { gap: 12, paddingBottom: 20 },
	empty: { textAlign: "center", color: "#555", fontSize: 16, marginTop: 40 },
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: PURPLE,
		borderRadius: 8,
		paddingVertical: 12,
		marginBottom: 20,
		gap: 12,
	},
	buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});