import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import Icon from "@expo/vector-icons/Ionicons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "../../components/common/AppHeader";

const RADAR_SIZE = 230;
const INNER_CIRCLE_SIZE = 155;
const CENTER_BUTTON_SIZE = 88;
const ACTION_BUTTON_SIZE = 46;

const QUICK_ACTIONS = [
  {
    id: "decoy",
    title: "Decoy Mode",
    subtitle: "Decoy Mode is active",
    icon: "shield-off",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    route: "DecoyScreen",
  },
  {
    id: "location",
    title: "Live Location",
    subtitle: "You have activated the monitoring of your live location",
    icon: "map-pin",
    color: "#10B981",
    bg: "#ECFDF5",
    route: "LocationScreen",
  },
  {
    id: "contacts",
    title: "Emergency Contacts",
    subtitle: "4 user saved emergency contacts",
    icon: "users",
    color: "#3B82F6",
    bg: "#EFF6FF",
    route: "EmergencyContactScreen",
  },
  {
    id: "vault",
    title: "Secure Vault",
    subtitle: "5 Cases include encrypted evidence",
    icon: "lock",
    color: "#F59E0B",
    bg: "#FFFBEB",
    route: "VaultScreen",
  },
];

const RADIAL_ACTIONS = [
  { id: "lock", icon: "shield-off", route: "DecoyScreen", angle: 225 },
  { id: "map", icon: "map-pin", route: "LocationScreen", angle: 315 },
  { id: "alert", icon: "alert-triangle", route: "SOSScreen", angle: 135 },
  { id: "user", icon: "users", route: "EmergencyContactScreen", angle: 45 },
];

const HomeScreen = () => {
  const navigation = useNavigation();

  const getRadialPosition = (angleInDegrees) => {
    const radius = RADAR_SIZE / 2;
    const radians = (angleInDegrees * Math.PI) / 180;
    const x = radius + radius * Math.cos(radians) - ACTION_BUTTON_SIZE / 2;
    const y = radius + radius * Math.sin(radians) - ACTION_BUTTON_SIZE / 2;
    return { left: x, top: y };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* //TODO: Change user to the users name that is logged in */}
      <AppHeader title="Welcome user" />

      <View style={styles.content}>
        {/* Protection Radar Section (Top) */}
        <View style={styles.radarSection}>
          <View style={styles.radarContainer}>
            <View style={styles.outerRing} />
            <View style={styles.innerRing} />

            {/* Center SOS Shield Button */}
            <TouchableOpacity
              style={styles.centerShield}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("SOSScreen")}
            >
              <View style={styles.logoBadge}>
                <Icon name="shield" size={42} color="#FFFFFF" />
                <Icon name="heart" size={18} color="#6B21A8" style={styles.logoBadgeHeart} />
              </View>
            </TouchableOpacity>

            {/* Orbiting Action Buttons */}
            {RADIAL_ACTIONS.map((action) => {
              const pos = getRadialPosition(action.angle);
              return (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.radialButton, pos]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(action.route)}
                >
                  <Feather name={action.icon} size={18} color="#FFFFFF" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Safety Tools Section (Bottom) */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Safety Tools</Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                style={styles.gridCard}
                onPress={() => item.route && navigation.navigate(item.route)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                  <Feather name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Floating Bottom Tab Bar */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <FontAwesome6 name="house-user" size={20} color="#6B21A8" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("EmergencyContactScreen")}
          >
            <FontAwesome6 name="address-book" size={20} color="#9CA3AF" />
            <Text style={styles.tabLabel}>Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("VaultScreen")}
          >
            <FontAwesome6 name="vault" size={20} color="#9CA3AF" />
            <Text style={styles.tabLabel}>Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("SupportHubSreen")}
          >
            <FontAwesome6 name="hand-holding-heart" size={20} color="#9CA3AF" />
            <Text style={styles.tabLabel}>Support Hub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("SettingsScreen")}
          >
            <FontAwesome6 name="gear" size={20} color="#9CA3AF" />
            <Text style={styles.tabLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8EEFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 90,
    justifyContent: "space-between",
    alignItems: "center",
  },

  /* Radar Section Styles */
  radarSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  radarContainer: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#A855F7",
    backgroundColor: "rgba(168, 85, 247, 0.03)",
  },
  innerRing: {
    position: "absolute",
    width: INNER_CIRCLE_SIZE,
    height: INNER_CIRCLE_SIZE,
    borderRadius: INNER_CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: "#C084FC",
    backgroundColor: "rgba(192, 132, 252, 0.05)",
  },
  centerShield: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: "#6B21A8",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 8,
    shadowColor: "#6B21A8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  logoBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeHeart: {
    position: "absolute",
    top: 11,
  },
  radialButton: {
    position: "absolute",
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    backgroundColor: "#7E22CE",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  /* Tools Grid Section */
  toolsSection: {
    width: "100%",
    alignItems: "left",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#581C87",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    width: "100%",
  },
  gridCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3E8FF",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
  },

  /* Floating Bottom Navigation Bar */
  tabContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  tabBar: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#6B21A8",
    fontWeight: "700",
  },
});

export default HomeScreen;