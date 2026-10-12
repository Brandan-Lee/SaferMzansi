import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const PURPLE = "#6B21A8";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BORDER = "#D8C7E8";
const DANGER = "#DC2626";

const CONFIRM_WORD = "DELETE";

const WILL_BE_DELETED = [
  { icon: "users", text: "Your emergency contacts" },
  { icon: "folder", text: "Evidence saved on this phone (recordings, photos, notes)" },
  { icon: "map-pin", text: "Saved incident locations" },
  { icon: "lock", text: "Your decoy code and app settings" },
  { icon: "log-out", text: "Your login on this phone" },
];

const WipeDataScreen = ({ navigation, route }) => {
  const [typed, setTyped] = useState("");
  const ready = typed.trim().toUpperCase() === CONFIRM_WORD;

  const handleWipe = () => {
    Alert.alert(
      "Wipe all app data?",
      "This can't be undone. Everything listed will be permanently deleted from this phone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe data",
          style: "destructive",
          onPress: async () => {
            // TODO: clear the SQLite tables, secure storage and the logged-in user (AuthContext)
            await route?.params?.onWipe?.();
            navigation?.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={30} color={DANGER} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wipe app data</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.warningBox}>
            <Feather name="alert-triangle" size={24} color={DANGER} />
            <Text style={styles.warningText}>
              This permanently deletes your SaferMzansi data from this phone. This action cannot be UNDONE.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>This will delete</Text>
          {WILL_BE_DELETED.map((item) => (
            <View key={item.text} style={styles.row}>
              <Feather name={item.icon} size={22} color={DANGER} />
              <Text style={styles.rowText}>{item.text}</Text>
            </View>
          ))}

          <Text style={styles.note}>
            Data in your encrypted cloud backup is not affected. Turn off cloud backup first if you want
            that removed too.
          </Text>

          <Text style={styles.sectionTitle}>
            Type <Text style={styles.confirmWord}>{CONFIRM_WORD}</Text> to confirm
          </Text>
          <TextInput
            style={[styles.input, ready && styles.inputReady]}
            value={typed}
            onChangeText={setTyped}
            placeholder={CONFIRM_WORD}
            placeholderTextColor="#D1D5DB"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, !ready && styles.buttonDisabled]}
          onPress={handleWipe}
          disabled={!ready}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Wipe app data</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7FF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 36, height: 40, justifyContent: "center", alignItems: "flex-start" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: DANGER },
  content: { paddingHorizontal: 22, paddingBottom: 30 },
  warningBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  warningText: { flex: 1, fontSize: 14, color: "#7F1D1D", lineHeight: 20, fontWeight: "500" },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: TEXT, marginTop: 22, marginBottom: 6 },
  confirmWord: { color: DANGER },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rowText: { flex: 1, fontSize: 15, color: TEXT },
  note: { fontSize: 13, color: MUTED, marginTop: 14, lineHeight: 19 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 17,
    letterSpacing: 2,
    color: TEXT,
  },
  inputReady: { borderColor: DANGER },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DANGER,
    borderRadius: 10,
    paddingVertical: 13,
    marginHorizontal: 22,
    marginBottom: 24,
    gap: 10,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
});

export default WipeDataScreen;