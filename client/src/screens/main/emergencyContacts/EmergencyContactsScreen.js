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

const PURPLE = "#6B21A8";

export default function EmergencyContactsScreen({ navigation }) {
	const db = useSQLiteContext();
	const route = useRoute();
	const { user } = useAuth();
	const userId = route.params?.userId || user?.userId;
	const [banner, setBanner] = useState(null);
	const [contacts, setContacts] = useState([]);
	const [loading, setLoading] = useState(true);

	const loadContacts = useCallback(async () => {
		if (!db || !userId) {
			setContacts([]);
			setBanner({
				message: "A signed-in user is required to load emergency contacts.",
				type: "error",
			});
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			setBanner(null);
			const res = await getEmergencyContacts(db, userId);

			setContacts(Array.isArray(res?.contacts) ? res.contacts : []);
		} catch (error) {
			setContacts([]);
			setBanner({
				message: "Emergency contacts could not be loaded. Please try again.",
				type: "error",
			});
			console.error("Failed to load emergency contacts:", error);
		} finally {
			setLoading(false);
		}
	}, [db, userId]);

	useFocusEffect(
		useCallback(() => {
			loadContacts();
		}, [loadContacts])
	);

	const contactCount = contacts.length;

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
			actionButton={
				contactCount < 5 ?
					{
						label: "Add contact",
						icon: "person-add-outline",
						onPress: () =>
							navigation.navigate("AddContactScreen", { userId }),
					}
					: null
			}
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
								navigation.navigate("ContactDetailsScreen", {
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

			<View style={styles.totalContainer}>
				<Text style={styles.total}>{contactCount} of 5 emergency contacts</Text>
			</View>
		</MainLayout>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	list: { gap: 12, paddingBottom: 12, paddingTop: 8 },
	empty: { textAlign: "center", color: "#475467", fontSize: 16, marginTop: 32 },
	totalContainer: { paddingVertical: 10, alignItems: "center" },
	total: { color: "#475467", fontSize: 13, fontWeight: "600" },
});
