import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CustomInput } from "@components/forms/CustomInput";
import { PrimaryButton } from "@components/forms/PrimaryButton";
import { useFormHandler } from "@hooks/useFormHandler";
import { CONTACT_FORM_FIELDS } from "@constants/ContactFields";
import { addEmergencyContact } from "@services/contactService";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@context/AuthContext";

const PURPLE = '#5E0A9E';

const INITIAL_STATE = {
    firstName: "",
    surname: "",
    phone: "",
    email: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;

export default function AddContactScreen({ onSave }) {
    const navigation = useNavigation();
    const route = useRoute();
    const db = useSQLiteContext();
    const { user } = useAuth();

    const [loading, setIsLoading] = useState(false);
    const { formData, errors, setErrors, handleChange, handleFieldBlur } = useFormHandler(INITIAL_STATE);

    const validate = () => {
        const e = {};
        const cleanPhone = formData.phone ? formData.phone.replace(/[\s-]/g, "") : "";

        if (!formData.firstName.trim()) e.firstName = "Please enter a name.";
        if (!formData.surname.trim()) e.surname = "Please enter a surname.";
        if (!cleanPhone && !formData.email.trim()) e.phone = "Please enter a phone number or email.";
        if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) e.phone = "Enter a valid phone number.";
        if (formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())) e.email = "Enter a valid email address.";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /**
     * Resolves the current user ID from:
     * 1. Navigation params
     * 2. AuthContext user session
     * 3. Local SQLite database fallback
     */
    const resolveUserId = async () => {
        if (route.params?.userId) return route.params.userId;
        if (user?.userId) return user.userId;

        try {
            const localUser = await db.getFirstAsync('SELECT id FROM users LIMIT 1');
            if (localUser?.id) return localUser.id;
        } catch (dbErr) {
            // Ignore if table doesn't exist
        }

        return null;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const activeUserId = await resolveUserId();

            if (!activeUserId) {
                throw new Error('A user session is required to add an emergency contact. Please log in again.');
            }

            const fullName = `${formData.firstName.trim()} ${formData.surname.trim()}`;
            const contactPayload = {
                firstName: formData.firstName.trim(),
                surname: formData.surname.trim(),
                phone: formData.phone,
                email: formData.email,
            };

            if (onSave) {
                await onSave({
                    id: Date.now().toString(),
                    name: fullName,
                    ...contactPayload,
                });
            } else {
                await addEmergencyContact(db, activeUserId, contactPayload);
            }

            Alert.alert(
                'Saved',
                `${fullName} was added to your emergency contacts.`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save contact.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (formData.firstName || formData.surname || formData.phone || formData.email) {
            Alert.alert('Discard contact?', 'Your changes will be lost.', [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            ]);
        } else {
            navigation.goBack();
        }
    };

    const initials = [formData.firstName.trim(), formData.surname.trim()]
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .join('');

    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="chevron-back" size={24} color={PURPLE} />
                            </TouchableOpacity>
                            <Text style={styles.title}>Add contact</Text>
                        </View>

                        {/* Avatar Initials Preview */}
                        <View style={styles.avatarFrame}>
                            <View style={styles.avatar}>
                                {initials ? (
                                    <Text style={styles.initials}>{initials}</Text>
                                ) : (
                                    <Ionicons name="person-outline" size={52} color={PURPLE} />
                                )}
                            </View>
                        </View>

                        {/* Mapped Form Fields */}
                        {CONTACT_FORM_FIELDS.map((field) => (
                            <View key={field.key}>
                                <CustomInput
                                    label={field.label}
                                    icon={field.icon}
                                    placeholder={field.placeholder}
                                    value={formData[field.key]}
                                    onChangeText={(val) => handleChange(field.key, val)}
                                    onBlur={() => {
                                        if (field.key !== "email" || formData.email.trim().length > 0) {
                                            handleFieldBlur(field.key);
                                        }
                                    }}
                                    keyboardType={field.keyboardType}
                                    autoCapitalize={field.autoCapitalize}
                                    error={errors[field.key]}
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Action Button */}
                    <View style={styles.footerContainer}>
                        <PrimaryButton
                            title="SAVE CONTACT"
                            onPress={handleSave}
                            loading={loading}
                        />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1, paddingHorizontal: 24 },
    scroll: { paddingBottom: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 10,
        gap: 10,
    },
    title: { fontSize: 22, fontWeight: '700', color: PURPLE },
    avatarFrame: {
        alignSelf: 'center',
        padding: 2,
        marginBottom: 12,
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#EFE3FA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: { fontSize: 26, fontWeight: '700', color: PURPLE },
    footerContainer: {
        paddingVertical: 10,
    },
});