import React from "react";
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../common/AppHeader";
import { AlertBadge } from "../common/AlertBadge";

export const MainLayout = ({
	title,
	subtitle,
	banner,
	children,
	navQuestion,
	navActionText,
	onNavPress,
	scrollable = true,
}) => {
	const ContainerView = scrollable ? ScrollView : View;

	return (
		<LinearGradient
			colors={["#D9D9D9", "#DECDFA"]}
			start={{ x: 0, y: 0 }}
			end={{ x: 0, y: 1 }}
			style={styles.gradient}
		>
			<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
				<KeyboardAvoidingView
					style={styles.flexOne}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
				>
					<ContainerView
						style={!scrollable && styles.flexOne}
						contentContainerStyle={
							scrollable ? styles.scrollContent : undefined
						}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
					>
						<View style={scrollable ? styles.scrollBody : styles.nonScrollBody}>
							<View style={styles.mainBlock}>
								<AppHeader title={title} subtitle={subtitle} />

								{banner?.message ? (
									<AlertBadge message={banner.message} type={banner.type} />
								) : null}

								<View
									style={
										scrollable
											? styles.contentContainer
											: styles.nonScrollContent
									}
								>
									{children}
								</View>

								{navQuestion && navActionText ? (
									<View style={styles.navRow}>
										<Text style={styles.navText}>{navQuestion}</Text>
										<TouchableOpacity onPress={onNavPress} activeOpacity={0.7}>
											<Text style={styles.navLink}> {navActionText}</Text>
										</TouchableOpacity>
									</View>
								) : null}
							</View>

							<Text style={styles.footerText}>
								Your safety. Your privacy. Our priority.
							</Text>
						</View>
					</ContainerView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</LinearGradient>
	);
};

const PURPLE = "#6B21A8";
const PURPLE_DARK = "#581C87";

const styles = StyleSheet.create({
	gradient: { flex: 1 },
	container: { flex: 1, backgroundColor: "transparent" },
	flexOne: { flex: 1 },
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 28,
		paddingTop: 16,
		paddingBottom: 24,
	},
	scrollBody: {
		flex: 1,
		justifyContent: "space-between",
	},
	nonScrollBody: {
		flex: 1,
		justifyContent: "center", // Keeps the login form centered and footer near the actions
		paddingHorizontal: 28,
		paddingTop: 16,
		paddingBottom: 24,
	},
	mainBlock: {
		width: "100%",
	},
	contentContainer: { width: "100%" },
	nonScrollContent: {
		width: "100%",
	},
	navRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 20,
		marginBottom: 12,
	},
	navText: { fontSize: 14, color: "#6B7280" },
	navLink: { fontSize: 14, color: PURPLE, fontWeight: "700" },
	footerText: {
		fontSize: 12,
		color: PURPLE_DARK,
		textAlign: "center",
		fontWeight: "600",
		marginTop: 16,
		paddingVertical: 8,
	},
});
