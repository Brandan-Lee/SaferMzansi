import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const PURPLE = "#6B21A8";
const BACKGROUND = "#FAF7FF";
const TEXT = "#1F1F1F";
const MUTED = "#666666";
const LIGHT_PURPLE = "#F1E5FA";
const BORDER = "#E4D5EF";

const PrivacyPolicyScreen = ({ onBack }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const Section = ({ number, title, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.numberCircle}>
          <Text style={styles.numberText}>{number}</Text>
        </View>

        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={20}
          >
            <Feather
              name="chevron-left"
              size={30}
              color={PURPLE}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Privacy Policy
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={38}
                color={PURPLE}
              />
            </View>

            <Text style={styles.introTitle}>
              Your Privacy Matters
            </Text>

            <Text style={styles.introText}>
              SaferMzansi is designed to protect your personal information,
              emergency information and evidence while providing safety and
              emergency-response features.
            </Text>
          </View>

          <View style={styles.updatedContainer}>
            <Feather
              name="info"
              size={16}
              color={PURPLE}
            />

            <Text style={styles.updatedText}>
              Privacy information for the SaferMzansi application
            </Text>
          </View>

          <Section
            number="1"
            title="Information We Collect"
          >
            SaferMzansi may collect information required to create and manage
            your account, including your name, email address, phone number and
            login information. The application may also store emergency
            contacts that you choose to add.
          </Section>

          <Section
            number="2"
            title="Location Information"
          >
            When location-based features are enabled, SaferMzansi may access
            your device location. During an emergency, location information may
            be used to help your configured emergency contacts locate you and
            to identify nearby support services.
          </Section>

          <Section
            number="3"
            title="Emergency Alerts"
          >
            When an emergency alert is triggered, SaferMzansi may use your
            emergency information and location to send alerts to the emergency
            contacts that you have configured in the application.
          </Section>

          <Section
            number="4"
            title="Evidence and Media"
          >
            SaferMzansi allows evidence such as audio recordings, images,
            videos and documents to be stored in the Evidence Vault. Evidence
            may first be stored securely on the device and synchronized with
            cloud storage when an internet connection becomes available.
          </Section>

          <Section
            number="5"
            title="How We Use Your Information"
          >
            Your information is used to provide account access, emergency
            alerts, evidence storage, emergency-contact features, location
            services and access to nearby support services.
          </Section>

          <Section
            number="6"
            title="Data Storage and Security"
          >
            SaferMzansi is designed to protect sensitive information using
            secure local and cloud storage. Evidence and personal information
            are protected using security measures defined by the SaferMzansi
            system design.
          </Section>

          <Section
            number="7"
            title="Offline Use and Synchronisation"
          >
            Some SaferMzansi features are designed to continue working when the
            device is offline. Information created while offline may be stored
            locally and synchronized with cloud services after connectivity is
            restored.
          </Section>

          <Section
            number="8"
            title="Information Sharing"
          >
            SaferMzansi may share emergency information with emergency contacts
            selected by the user when an emergency alert is activated. The
            application does not automatically dispatch alerts directly to
            law-enforcement agencies or emergency services.
          </Section>

          <Section
            number="9"
            title="Your Choices and Control"
          >
            You can control supported application settings such as live
            location sharing, automatic recording and encrypted cloud backup.
            You may also manage your profile and supported local application
            settings.
          </Section>

          <Section
            number="10"
            title="Privacy and POPIA"
          >
            SaferMzansi is designed with privacy and data-protection safeguards
            intended to support compliance with South Africa's Protection of
            Personal Information Act (POPIA).
          </Section>

          <Section
            number="11"
            title="Policy Updates"
          >
            This privacy information may be updated as SaferMzansi features,
            security controls and data-handling processes change during the
            development of the application.
          </Section>

          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={24}
              color={PURPLE}
            />

            <Text style={styles.footerText}>
              SaferMzansi{"\n"}
              Your safety. Your privacy. Our priority.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingRight: 20,
  },

  backButton: {
    width: 58,
    height: 62,
    justifyContent: "center",
    alignItems: "center",
  },

  backButtonPressed: {
    opacity: 0.4,
    backgroundColor: LIGHT_PURPLE,
  },

  headerTitle: {
    color: PURPLE,
    fontSize: 22,
    fontWeight: "bold",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 40,
  },

  introContainer: {
    alignItems: "center",
    marginBottom: 22,
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: LIGHT_PURPLE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  introTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: TEXT,
    marginBottom: 9,
  },

  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  updatedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
  },

  updatedText: {
    flex: 1,
    marginLeft: 10,
    color: "#4A3555",
    fontSize: 13,
    lineHeight: 18,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LIGHT_PURPLE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  numberText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: "bold",
  },

  sectionTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 16,
    fontWeight: "bold",
  },

  sectionText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: 38,
  },

  footer: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 24,
    marginTop: 4,
  },

  footerText: {
    textAlign: "center",
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});

export default PrivacyPolicyScreen;