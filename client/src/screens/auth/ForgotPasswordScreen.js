import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useNetStatus } from "../../utils/NetStatus";
import { useFormHandler } from "../../hooks/UseFormHandler";
import { sendOtpEmail } from "../../services/EmailService";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { checkNetworkAndNotify } from "../../utils/NetworkGuard";


const FORGOT_PASSWORD_FORM_FIELDS = [
  {
    key: "email",
    label: "Email Address",
    placeholder: "Enter your email",
    icon: "mail",
    keyboardType: "email-address",
    autoCapitalize: "none",
  },
];

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { isOnline } = useNetStatus();
  const { formData, errors, handleChange, handleFieldBlur } =
    useFormHandler({ email: "" });
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle navigation back to the login screen
  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const handleSendOTP = async () => {
    setBanner(null);

    // Check internet connectivity
    //The user was not online when registering
    checkNetworkAndNotify(isOnline, banner);

    // Basic email validation check
    const sanitizedEmail = formData.email.trim().toLowerCase();

    try {
      setLoading(true);

      // Directly call backend OTP endpoint for password reset
      const otpResponse = await sendOtpEmail(sanitizedEmail);



      if (otpResponse?.error) {
        setBanner({
          message:
            otpResponse?.error ||
            "Failed to send a verification code. Please request a new one on the next screen",
          type: "error",
        });
      } else {
        setBanner({
          message: "We have sent an OTP to your email address.",
          type: "success",
        });
      }

      setTimeout(() => {
        navigation.navigate("OTPScreen", { email: sanitizedEmail, isResetPassword: true });
      }, 800);

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
    <AuthScreenLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a OTP to reset your password"
      banner={banner}
    >
      {FORGOT_PASSWORD_FORM_FIELDS.map((field) => (
        <CustomInput
          key={field.key}
          label={field.label}
          icon={field.icon}
          placeholder={field.placeholder}
          value={formData[field.key]}
          onChangeText={(val) => handleChange(field.key, val)}
          onBlur={() => handleFieldBlur(field.key)}
          secureTextEntry={field.secureTextEntry}
          keyboardType={field.keyboardType}
          autoCapitalize={field.autoCapitalize}
          error={errors[field.key]}
        />
      ))}

      <PrimaryButton
        title="SEND OTP"
        onPress={handleSendOTP}
        loading={loading}
      />

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
    </AuthScreenLayout>
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
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#111827",
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

  button: {
    width: "100%",
    height: 56,
    backgroundColor: "#6B21A8",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },

  backText: {
    color: '#6F20B8',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default ForgotPasswordScreen;
