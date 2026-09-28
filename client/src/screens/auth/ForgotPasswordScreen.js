import React, { useState } from "react";
import {
  StyleSheet,
  Text,
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
        title = "SEND OTP"
        onPress = {handleSendOTP}
        loadin = {loading}
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
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
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
