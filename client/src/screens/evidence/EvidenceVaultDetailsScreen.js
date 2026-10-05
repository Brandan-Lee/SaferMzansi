import React from "react"; 
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,  
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const EvidenceVaultDetailsScreen = ({ onBack }) => {
  const evidenceItems = [
    {
      id: "1",
      date: "Oct 1",
      time: "09:18",
      files: ["image", "mic", "image"],
    },
    {
      id: "2",
      date: "Sep 30",
      time: "18:42",
      files: ["video", "mic"],
    },
    {
      id: "3",
      date: "Sep 29",
      time: "14:26",
      files: ["image"],
    },
  ];

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    Alert.alert(
      "Back",
      "Back navigation will be connected later."
    );
  };

  const handleUpload = () => {
    Alert.alert(
      "Upload",
      "Upload function will be connected later."
    );
  };

  const handleEvidencePress = (item) => {
    Alert.alert(
      "Evidence",
      `${item.date} at ${item.time}`
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

      {/* Evidence List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {evidenceItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => handleEvidencePress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.date}>
                  {item.date}
                </Text>

                <Text style={styles.time}>
                  {item.time}
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={32}
                color="#2D1638"
              />
            </View>

            <View style={styles.fileRow}>
              {item.files.map((icon, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={styles.fileIconContainer}
                >
                  <Feather
                    name={icon}
                    size={23}
                    color="#2D1638"
                  />
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    paddingBottom: 18,
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

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#6B21A8",
    borderRadius: 18,
    padding: 18,
    minHeight: 150,
    marginBottom: 20,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  date: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },

  time: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B21A8",
    marginTop: 2,
  },

  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
  },

  fileIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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

export default EvidenceVaultDetailsScreen;