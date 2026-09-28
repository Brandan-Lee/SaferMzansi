import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { CustomInput } from "../../components/common/CustomInput";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { FORGOT_PASSWORD_FORM_FIELDS } from "../../constants/AuthFields";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { useNavigation } from "@react-navigation/native";
import { useFormHandler } from "../../hooks/UseFormHandler";

const INITIAL_STATE = {
  email: "",
};

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const {formData, errors, setErrors, handleChange, handleFieldBlur} = useFormHandler(INITIAL_STATE);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isOnline } = useNetStatus();

  const handleSendOTP = async () => {
    setBanner(null);
    setLoading(true);

    //Check to see if the user entered data into the email field
    const { isValid, errors, validationErrors } = validateForgotPasswordForm(formData);

    //Validation has failed
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    //Check user online status
    checkNetworkAndNotify(isOnline, banner);

    try {
      const sanitizedEmail = formData.email.trim().toLowerCase();
      //Use UserService to find mathching user email
      const result = await forgotPassword({
        email: sanitizedEmail,
      });

      if (result?.success) {
        //Once the users email has been verified, send a request to the server sending the OTP email. The server will handle sending the email
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
						message: "Validation of email during forgot password screen successful! Sending verification code...",
						type: "success",
					});
				}
      }
    }
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
    flexDirection: "row",
    alignItems: "center",
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
