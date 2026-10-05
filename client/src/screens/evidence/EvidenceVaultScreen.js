import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
}   from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const EvidenceVaultScreen = ({ onUpload }) => {
  const handleBack = () => {
    Alert.alert(
      "Back",
      "Back navigation will be connected later."
    );
  };

  const handleUpload = () => {
    if (onUpload) {
      onUpload();
      return;
    }

    Alert.alert(
      "Upload",
      "Upload function will be connected later."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Feather
            name="chevron-left"
            size={30}
            color="#6B21A8"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Evidence Vault
        </Text>
      </View>

      {/* Empty State */}
      <View style={styles.content}>
        <Feather
          name="alert-circle"
          size={96}
          color="#2D1638"
        />

        <Text style={styles.title}>
          Nothing uploaded yet
        </Text>

        <Text style={styles.subtitle}>
          Everything uploaded here{"\n"}is encrypted.
        </Text>
      </View>

      {/* Upload Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUpload}
          activeOpacity={0.85}
        >
          <Feather
            name="upload"
            size={24}
            color="#FFFFFF"
          />

          <Text style={styles.uploadText}>
            Upload
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7FF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  backButton: {
    width: 36,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6B21A8",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 55,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    textAlign: "center",
  },

  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  uploadButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#6B21A8",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  uploadText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 18,
  },
});

export default EvidenceVaultScreen;