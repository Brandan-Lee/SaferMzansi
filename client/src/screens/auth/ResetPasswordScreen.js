import React, { useState } from "react";
import{
    StyleSheet,
    Text,
    View,
    ScrollView,
    Alert,
}   from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";

const ResetPasswordScreen = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errors, setErrors] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const handleResetPassword = () => {
        const newErrors = {
            newPassword: "",
            confirmPassword: "",
        };

        if (!newPassword.trim()) {
            newErrors.newPassword = "Please enter a new password.";
        }   else if (newPassword.length < 8) {
            newErrors.newPassword = "Password must be at least 8 characters."; 
        }

        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = "Please confirm your password.";
        }   else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);

        if (
            newErrors.newPassword ||
            newErrors.confirmPassword
        )   {
            return;
        }

        Alert.alert(
            "Password Reset",
            "Your password has been reset successfully."
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollcontent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>

                    {/* Logo */}
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
                        Reset Password
                    </Text>

                    {/*Description */}
                    <Text style={styles.subtitle}>
                        Create a new password for your account.
                    </Text>

                    {/* New Password */}
                    <CustomInput
                        label="New Password"
                        icon="lock"
                        placeholder="••••••••"
                        value={newPassword}
                        onChangeText={(value) => {
                            setNewPassword(value);

                            if (errors.newPassword) {
                                setErrors((prev) => ({
                                    ...prev,
                                    newPassword: "",
                                }));
                            }
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        error={errors.newPassword}
                    />

                    {/* Confirm Password */}
                    <CustomInput
                        label="Confirm Password"
                        icon="lock"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChangeText={(value) => {
                            setConfirmPassword(value);

                            if (errors.confirmPassword) {
                                setErrors((prev) => ({
                                    ...prev,
                                    confirmPassword: "",
                                }));
                            }
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        error={errors.confirmPassword}
                    />

                    {/* Reset Button */}
                    <PrimaryButton
                        title="RESET PASSWORD"
                        onPress={handleResetPassword}
                    /> 

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "FAF7FF",
    },

    scrollcontent: {
        flexGrow: 1,
    },

    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 30,
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
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 16,
        color: "#374151",
        textAlign: "center",
        marginBottom: 28,
    },
});

export default ResetPasswordScreen;
