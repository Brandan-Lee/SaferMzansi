import React, { useCallback, useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	ScrollView,
	Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import MainLayout from "@components/layouts/MainLayout";
import { KeyboardAvoidingView } from "react-native";
import ProfileDetailCard from "@components/cards/ProfileDetailCard";
import { useAuth } from "@context/AuthContext";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";
import {
	getLocalUserDetails,
	hardDeleteAccount,
	softDeleteUser,
} from "@services/main/userService";
import { forgotPasswordUser } from "@services/auth/authService";
import { checkNetworkAndNotify } from "@utils/network/networkGuard";
import { useNetStatus } from "@utils/network/netStatus";
import AccountDeletionModal from "@components/modals/AccountDeletionModal";
import { softDeleteLocalEmergencyContact } from "@database/repositories/contactRepository";

const PURPLE = "#5E0A9E";

const ProfileScreen = ({ navigation }) => {
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
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [banner, setBanner] = useState(null);
	const { user, logOut } = useAuth();
	const [userDetails, setUserDetails] = useState(null);
	const db = useSQLiteContext();
	const [loading, setLoading] = useState(false);
	const { isOnline } = useNetStatus();

	const firstName = userDetails?.firstName || user?.name || "";
	const surname = userDetails?.surname || user?.surname || "";
	const fullName =
		`${firstName} ${surname}`.trim() || user?.userName || "User Profile";

	const loadUser = useCallback(async () => {
		try {
			setLoading(true);
			const userRecord = await getLocalUserDetails(db, user.userId);
			setUserDetails(userRecord);
		} catch (error) {
			console.error("Failed to load user profile:", error);
		} finally {
			setLoading(false);
		}
	}, [db, user.userId]);

	// Fetch data whenever the screen gains focus
	useFocusEffect(
		useCallback(() => {
			let isMounted = true;
			loadUser();
			return () => {
				isMounted = false;
			};
		}, [loadUser]),
	);

	const initials = [firstName, surname]
		.filter(Boolean)
		.map((w) => w[0].toUpperCase())
		.join("");

	const handleEditScreen = () => {
		navigation.replace("EditProfileScreen", { userDetails });
	};

	const handleSendOTP = async () => {
		setBanner(null);

		if (!checkNetworkAndNotify(isOnline, setBanner)) {
			return;
		}

		setLoading(true);

		try {
			const sanitizedEmail =
				userDetails?.email?.trim().toLowerCase() ||
				user?.email?.trim().toLowerCase();

			await forgotPasswordUser(sanitizedEmail);
			setBanner({
				message: "Password reset code sent successfully.",
				type: "success",
			});

			await logOut("OTPScreen", {
				email: sanitizedEmail,
				isResetPassword: true,
			});
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"An error occurred while sending the OTP. Please try again.",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleSoftDelete = async () => {
		setBanner(null);
		setLoading(true);

		try {
			if (!checkNetworkAndNotify(isOnline, setBanner)) {
				return;
			}

			setLoading(true);

			await softDeleteUser(db, user.userId);

			setBanner({
				message: "Account has been deleted successfully.",
				type: "success",
			});
			setTimeout(async () => {
				setDeleteModalVisible(false);
				await logOut("LoginScreen");
			}, 800);
		} catch (error) {
			setBanner({
				message: error.message || "Failed to soft delete account.",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleHardDelete = async () => {
		setBanner(null);
		setLoading(true);

		try {
			if (!checkNetworkAndNotify(isOnline, setBanner)) {
				return;
			}

			await hardDeleteAccount(db, user.userId);

			setBanner({ message: "Account permanently deleted.", type: "success" });
			setTimeout(async () => {
				setDeleteModalVisible(false);
				await logOut("LoginScreen");
			}, 800);
		} catch (error) {
			setBanner({
				message: error.message || "Failed to permanently delete account",
				type: "error",
			});
		}
	};

	const hideModal = () => {
		setModalConfig((prev) => ({ ...prev, visible: false }));
	};

	return (
		<MainLayout
			title="User Profle"
			onBack={() => navigation.replace("SettingsScreen")}
			tab="Settings"
			navigation={navigation}
			banner={banner}
		>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Avatar Section */}
					<View style={styles.avatarFrame}>
						<View style={styles.avatar}>
							{initials ? (
								<Text style={styles.initials}>{initials}</Text>
							) : (
								<Ionicons name="person-outline" size={32} color={PURPLE} />
							)}
						</View>
					</View>

					<View style={styles.profileSection}>
						<Text style={styles.profileName}>{fullName}</Text>
						<Text style={styles.profileEmail}>
							{userDetails?.email || user?.email}
						</Text>
					</View>

					{/* Personal Information */}
					<Text style={styles.sectionTitle}>Personal Information</Text>
					<ProfileDetailCard
						icon="person-outline"
						label="Name"
						value={firstName}
					/>
					<ProfileDetailCard
						icon="people-outline"
						label="Surname"
						value={surname}
					/>
					<ProfileDetailCard
						icon="mail-outline"
						label="Email address"
						value={userDetails?.email || user?.email}
					/>
					<ProfileDetailCard
						icon="call-outline"
						label="Phone number"
						value={userDetails?.userNumber}
					/>

					{/* Security Section */}
					<Text style={styles.sectionTitle}>Security & Actions</Text>
					<TouchableOpacity
						style={styles.optionButton}
						onPress={handleSendOTP}
						activeOpacity={0.8}
					>
						<Feather
							name="lock"
							size={20}
							color={PURPLE}
							style={styles.optionIcon}
						/>
						<Text style={styles.optionButtonText}>Change Password</Text>
						<Ionicons name="chevron-forward" size={18} color="#999" />
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.primaryActionButton}
						onPress={handleEditScreen}
						activeOpacity={0.8}
					>
						<Ionicons name="create-outline" size={20} color="#FFFFFF" />
						<Text style={styles.primaryActionText}>Edit Profile</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.deleteButton}
						activeOpacity={0.8}
						onPress={() => setDeleteModalVisible(true)}
					>
						<Ionicons name="trash-outline" size={20} color="#fff" />
						<Text style={styles.primaryText}>Delete Account</Text>
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>

			<ConfirmationModal
				visible={modalConfig.visible}
				title={modalConfig.title}
				message={modalConfig.message}
				confirmLabel={modalConfig.confirmLabel}
				cancelLabel={modalConfig.cancelLabel}
				isDestructive={modalConfig.isDestructive}
				iconName={modalConfig.iconName}
				onConfirm={modalConfig.onConfirm}
				onCancel={hideModal}
			/>
			<AccountDeletionModal
				visible={deleteModalVisible}
				loading={loading}
				banner={banner}
				onCancel={() => setDeleteModalVisible(false)}
				onSoftDelete={handleSoftDelete}
				onHardDelete={handleHardDelete}
			/>
		</MainLayout>
	);
};

const styles = StyleSheet.create({
	scroll: {
		paddingBottom: 30,
	},
	avatarFrame: {
		alignSelf: "center",
		marginTop: 8,
		marginBottom: 8,
	},
	avatar: {
		width: 76,
		height: 76,
		borderRadius: 38,
		backgroundColor: "#EFE3FA",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#D8B4FE",
	},
	initials: {
		fontSize: 28,
		fontWeight: "700",
		color: PURPLE,
	},
	profileSection: {
		alignItems: "center",
		marginBottom: 24,
	},
	profileName: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111",
		marginTop: 4,
	},
	profileEmail: {
		fontSize: 13,
		color: "#666",
		marginTop: 2,
		fontWeight: "500",
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#1F2937",
		marginBottom: 10,
		marginTop: 12,
	},
	optionButton: {
		height: 50,
		borderRadius: 10,
		backgroundColor: "#FFFFFF",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		marginBottom: 12,
		alignItems: "center",
		flexDirection: "row",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		shadowColor: "#000",
		shadowOpacity: 0.03,
		shadowRadius: 2,
		shadowOffset: { width: 0, height: 1 },
		elevation: 1,
	},
	optionIcon: {
		marginRight: 12,
	},
	optionButtonText: {
		fontSize: 15,
		color: "#1F2937",
		fontWeight: "600",
		flex: 1,
	},
	primaryActionButton: {
		height: 50,
		borderRadius: 10,
		backgroundColor: PURPLE,
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		marginBottom: 12,
		gap: 8,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 3,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	primaryActionText: {
		fontSize: 15,
		color: "#FFFFFF",
		fontWeight: "600",
	},
	deleteButton: {
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
});

export default ProfileScreen;
