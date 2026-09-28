import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native";
import { useNetStatus } from "../../utils/NetStatus";
import { useFormHandler } from "../../hooks/UseFormHandler";
import { API_BASE_URL } from "../../utils/config";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { isOnline } = useNetStatus();
  const { formData, errors, setErrors, handleChange, handleFieldBlur } =
    useFormHandler({ email: "" });
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    setBanner(null);

    // Check internet connectivity
    if (!isOnline) {
      setBanner({
        message: "Internet Connection Required. Please connect to proceed.",
        type: "error",
      });
      return;
    }

    // Basic email validation check
    const emailToSubmit = formData.email.trim().toLowerCase();
    if (!emailToSubmit || !emailToSubmit.includes('@') || !emailToSubmit.includes('.')) {
      setBanner({
        message: "Please enter a valid email address.",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      // Directly call backend OTP endpoint for password reset
      const response = await fetch(`${API_BASE_URL}/send-otp-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToSubmit }),
      });

      if (response.ok) {

        setBanner({
          message: "We have sent an OTP to your email address.",
          type: "success",
        });

        setTimeout(() => {
          navigation.navigate("OTPScreen", { email: emailToSubmit, isResetPassword: true });
        }, 800);
      } else {
        setBanner({
          message: "Failed to send OTP. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      setBanner({
        message:
          error.message || "An error occurred while sending the OTP. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* SaferMzansi Logo Area */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>
          </Text>
          <Text style={styles.logoText}>
            SaferMzansi
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Forgot Password?
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          Enter your email address to receive a OTP to reset your Password.
        </Text>

        {/* Status Banner Output */}
        {banner && (
          <View
            style={[
              styles.banner,
              banner.type === "error" ? styles.bannerError : styles.bannerSuccess,
            ]}
          >
            <Text style={styles.bannerText}>{banner.message}</Text>
          </View>
        )}

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#777777"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(val) => handleChange("email", val)}
          onBlur={() => handleFieldBlur("email")}
        />

        {/* Send OTP Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSendOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send OTP"}
          </Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          onPress={() => {
            if (navigation) {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backText}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
    alignItems: 'center',
  },

  /* Logo */
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logoIcon: {
    fontSize: 38,
    color: '#7B16D9',
    fontWeight: 'bold',
  },

  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#7B16D9',
  },

  /* Title */
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 15,
  },

  /* Description */
  description: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 30,
    color: '#777777',
    marginBottom: 30,
  },

  /* Status Banner */
  banner: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  bannerError: {
    backgroundColor: '#FEE2E2',
  },
  bannerSuccess: {
    backgroundColor: '#DCFCE7',
  },
  bannerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#1F2937',
  },

  /* Email Input */
  input: {
    width: '100%',
    height: 70,
    backgroundColor: '#F7F5F8',
    borderWidth: 1,
    borderColor: '#ECE8EF',
    borderRadius: 14,
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
    width: '100%',
    height: 58,
    backgroundColor: '#7A0AD9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // Vertical centering fix
    marginTop: 45,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  backText: {
    color: '#6F20B8',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 30,
  },
});

export default ForgotPasswordScreen;
