import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AlertBadge } from "@components/common/AlertBadge";
import { NavigationBar } from "@components/common/NavigationBar";

const PURPLE = "#6B21A8";

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
		<LinearGradient
			colors={["#D9D9D9", "#DECDFA"]}
			start={{ x: 0, y: 0 }}
			end={{ x: 0, y: 1 }}
			style={styles.gradient}
		>
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<View style={styles.innerContainer}>
					{title && (
						<View style={styles.header}>
							{onBack && (
								<TouchableOpacity
									style={styles.backButton}
									onPress={onBack}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									accessibilityRole="button"
									accessibilityLabel="Go back"
								>
									<Ionicons name="chevron-back" size={24} color={PURPLE} />
								</TouchableOpacity>
							)}
							<Text style={styles.title}>{title}</Text>
						</View>
					)}

					{banner?.message ? (
						<AlertBadge
							message={banner.message}
							type={banner.type}
							onDismiss={banner.onDismiss}
						/>
					) : null}

					<View style={styles.content}>{children}</View>

					{actionButton ? (
						<TouchableOpacity
							style={[
								styles.button,
								actionButton.variant === "secondary" && styles.secondaryButton,
								actionButton.variant === "destructive" && styles.destructiveButton,
								actionButton.style,
							]}
							activeOpacity={actionButton.activeOpacity || 0.8}
							onPress={actionButton.onPress}
							disabled={actionButton.disabled || actionButton.loading}
							accessibilityRole="button"
							accessibilityLabel={actionButton.label}
							accessibilityState={{
								disabled: actionButton.disabled || actionButton.loading,
								busy: actionButton.loading,
							}}
						>
							{actionButton.icon && (
								<Ionicons
									name={actionButton.icon}
									size={24}
									color={
										actionButton.iconColor ||
										(actionButton.variant === "secondary" ? PURPLE : "#fff")
									}
								/>
							)}
							<Text
								style={[
									styles.buttonText,
									actionButton.variant === "secondary" && styles.secondaryButtonText,
								]}
							>
								{actionButton.label}
							</Text>
						</TouchableOpacity>
					) : null}
				</View>
			</SafeAreaView>
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
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12,
		marginBottom: 20,
		gap: 10,
	},
	backButton: {
		width: 48,
		height: 48,
		alignItems: "center",
		justifyContent: "center",
	},
	title: { flex: 1, flexShrink: 1, fontSize: 22, fontWeight: "700", color: PURPLE },
	content: { flex: 1 },
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: PURPLE,
		borderRadius: 8,
		minHeight: 52,
		paddingVertical: 12,
		marginBottom: 12,
		gap: 12,
	},
	buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
	secondaryButton: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: PURPLE,
	},
	secondaryButtonText: { color: PURPLE },
	destructiveButton: { backgroundColor: "#B42318" },
	navWrapper: { width: "100%" },
});

export default MainLayout;
