import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");

  const handleSendOTP = () => {
    if (email.trim() === "") {
      Alert.alert(
        "Error",
        "Please enter your email address."
      );
      return;
    }

    if (!email.includes("@")) {
      Alert.alert(
        "Error",
        "Please enter a valid email address."
      );
      return;
    }

    if (navigation) {
      navigation.navigate("OTPScreen");
    }
  };

  const handleBackToLogin = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>

          {/* SaferMzansi Logo */}
          <View style={styles.logoBadge}>
            <Feather
              name="shield"
              size={40}
              color="#6B21A8"
            />
          </View>

          <Text style={styles.logo}>
            SaferMzansi
          </Text>

          {/* Title */}
          <Text style={styles.title}>
            Forgot Password?
          </Text>

          {/* Description */}
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you an OTP to reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Feather
              name="mail"
              size={20}
              color="#6B21A8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendOTP}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              Send OTP
            </Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Feather
              name="chevron-left"
              size={20}
              color="#6B21A8"
            />

            <Text style={styles.backText}>
              Back to Login
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7FF",
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 35,
  },

  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6B21A8",
    marginBottom: 28,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },

  subtitle: {
    width: "100%",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#374151",
    marginBottom: 28,
    paddingHorizontal: 10,
  },

  inputContainer: {
    width: "100%",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 16,
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#111827",
  },

  button: {
    width: "100%",
    height: 56,
    backgroundColor: "#6B21A8",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },

  backText: {
    color: "#6B21A8",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ForgotPasswordScreen;
