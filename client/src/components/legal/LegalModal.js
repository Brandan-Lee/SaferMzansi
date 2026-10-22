import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { Feather } from "@expo/vector-icons";

const PURPLE = "#6B21A8";
const BACKGROUND = "#FAF7FF";
const WHITE = "#FFFFFF";
const TEXT = "#1F1F1F";
const MUTED = "#666666";
const LIGHT_PURPLE = "#F1E5FA";
const BORDER = "#E4D5EF";

export const LegalParagraph = ({ children }) => (
  <Text style={styles.paragraph}>
    {children}
  </Text>
);

export const LegalSubheading = ({ children }) => (
  <Text style={styles.subheading}>
    {children}
  </Text>
);

export const LegalBullet = ({ children }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />

    <Text style={styles.bulletText}>
      {children}
    </Text>
  </View>
);

export const LegalSection = ({
  number,
  title,
  children,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>
          {number}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        {title}
      </Text>
    </View>

    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

export const LegalContactLine = ({
  label,
  value,
}) => (
  <View style={styles.contactRow}>
    <Text style={styles.contactLabel}>
      {label}
    </Text>

    <Text style={styles.contactValue}>
      {value}
    </Text>
  </View>
);

export default function LegalModal({
  visible,
  onClose,
  title,
  lastUpdated,
  type = "document",
  children,
}) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather
              name={
                type === "privacy"
                  ? "shield"
                  : "file-text"
              }
              size={23}
              color={PURPLE}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              {title}
            </Text>

            <Text style={styles.updated}>
              Last Updated: {lastUpdated}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onClose}
            style={styles.xButton}
          >
            <Feather
              name="x"
              size={25}
              color={PURPLE}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={true}
        >
          {children}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    justifyContent: "flex-end",
    backgroundColor: "rgba(20, 8, 30, 0.50)",
  },

  modalContainer: {
    height: "90%",
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  handle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D3BEDF",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 7,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: LIGHT_PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    color: PURPLE,
    fontSize: 21,
    fontWeight: "700",
  },

  updated: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },

  xButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },

  paragraph: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 13,
  },

  section: {
    marginBottom: 27,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  numberCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: LIGHT_PURPLE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  numberText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: "700",
  },

  sectionTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },

  sectionContent: {
    paddingLeft: 41,
  },

  subheading: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 2,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PURPLE,
    marginTop: 8,
    marginRight: 10,
  },

  bulletText: {
    flex: 1,
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
  },

  contactRow: {
    marginBottom: 12,
  },

  contactLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },

  contactValue: {
    color: PURPLE,
    fontSize: 14,
    lineHeight: 21,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  closeButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "700",
  },
});