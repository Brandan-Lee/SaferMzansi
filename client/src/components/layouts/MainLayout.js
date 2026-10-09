import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AlertBadge } from "@components/common/AlertBadge";
import { NavigationBar } from "@components/common/NavigationBar";

const PURPLE = "#5E0A9E";

const MainLayout = ({
	title,
	onBack,
	children,
	banner,
	tab,
	navigation,
	actionButton,
}) => {
	return (
		<LinearGradient colors={["#D9D9D9", "#DECDFA"]}
			start={{ x: 0, y: 0 }}
			end={{ x: 0, y: 1 }}
			style={styles.gradient}>
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<View style={styles.innerContainer}>
					{title && (
						<View style={styles.header}>
							{onBack && (
								<TouchableOpacity
									onPress={onBack}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
								>
									<Ionicons name="chevron-back" size={24} color={PURPLE} />
								</TouchableOpacity>
							)}
							<Text style={styles.title}>{title}</Text>
						</View>
					)}

					{banner?.message ? (
						<AlertBadge message={banner.message} type={banner.type} />
					) : null}

					<View style={styles.content}>{children}</View>

					{actionButton ? (
						<TouchableOpacity
							style={[styles.button, actionButton.style]}
							activeOpacity={actionButton.activeOpacity || 0.8}
							onPress={actionButton.onPress}
						>
							{actionButton.icon && (
								<Ionicons
									name={actionButton.icon}
									size={24}
									color={actionButton.iconColor || "#fff"}
								/>
							)}
							<Text style={styles.buttonText}>{actionButton.label}</Text>
						</TouchableOpacity>
					) : null}
				</View>
			</SafeAreaView>

			{/* Render navigation bar outside SafeAreaView to span full edge-to-edge width */}
			<View style={styles.navWrapper}>
				<NavigationBar activeTab={tab} navigation={navigation} />
			</View>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	gradient: { flex: 1 },
	safeArea: { flex: 1 },
	innerContainer: {
		flex: 1,
		paddingHorizontal: 24,
		paddingBottom: 70, // Leaves space so content isn't hidden behind the bottom bar
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12,
		marginBottom: 20,
		gap: 10,
	},
	title: { fontSize: 22, fontWeight: "700", color: PURPLE },
	content: { flex: 1 },
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: PURPLE,
		borderRadius: 8,
		paddingVertical: 12,
		marginBottom: 50,
		gap: 12,
	},
	buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
	navWrapper: {
		position: "absolute",
		bottom: 20,
		left: 0,
		right: 0,
		width: "100%",
	},
});

export default MainLayout;
