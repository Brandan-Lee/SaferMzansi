import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = '#5E0A9E';
const INPUT_BACKGROUND = '#FFFFFF';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;

export default function AddContactScreen({ onSave, onBack }) {
    const [firstName, setFirstName] = useState("");
    const [surname, setSurname] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [focused, setFocused] = useState(null);

    const validate = () => {
        const e = {};
        const cleanPhone = phone.replace(/[\s-]/g, "");
        if (!firstName.trim()) e.firstName = "Please enter a name.";
        if (!surname.trim()) e.surname = "Please enter a surname.";
        if (!cleanPhone && !email.trim()) e.phone = "Please enter a phone number or email.";
        if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) e.phone = "Enter a valid phone number.";
        if (email.trim() && !EMAIL_REGEX.test(email.trim())) e.email = "Enter a valid email address.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        const fullName = `${firstName.trim()} ${surname.trim()}`;
        if (onSave) {
            onSave({
                id: Date.now().toString(),
                firstName: firstName.trim(),
                surname: surname.trim(),
                name: fullName,
                phone: phone.replace(/[\s-]/g, ""),
                email: email.trim(),
            });
        }
        Alert.alert('Saved', `${fullName} was added to your emergency contacts.`);
    };

    const handleBack = () => {
        if (firstName || surname || phone || email) {
            Alert.alert('Discard contact?', 'Your changes will be lost.', [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: onBack },
            ]);
        } else if (onBack) {
            onBack();
        }
    };

    const initials = [firstName.trim(), surname.trim()]
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .join('');

    const renderField = (key, label, value, setValue, placeholder, keyboardType, icon) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View
                style={[
                    styles.inputRow,
                    focused === key && styles.inputFocused,
                    errors[key] && styles.inputError,
                ]}
            >
                <Ionicons
                    name={icon}
                    size={18}
                    color={errors[key] ? '#C62828' : focused === key ? PURPLE : '#5E0A9E'}
                    style={styles.inputIcon}
                />
                <TextInput
                style={styles.input}
                value={value}
                onChangeText={(t) => {
                    setValue(t);
                    if (errors[key]) setErrors({ ...errors, [key]: undefined });
                }}
                placeholder={placeholder}
                placeholderTextColor="#888"
                keyboardType={keyboardType}
                autoCapitalize={key === 'firstName' || key === 'surname' ? 'words' : 'none'}
                onFocus={() => setFocused(key)}
                onBlur={() => setFocused(null)}
                />
            </View>
            {errors[key] ? <Text style={styles.error}>{errors[key]}</Text> : null}
        </View>
    );

    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="chevron-back" size={24} color={PURPLE} />
                            </TouchableOpacity>
                            <Text style={styles.title}>Add contact</Text>
                        </View>

                        <View style={styles.avatarFrame}>
                            <View style={styles.avatar}>
                                {initials ? (
                                    <Text style={styles.initials}>{initials}</Text>
                                ) : (
                                    <Ionicons name="person-outline" size={52} color={PURPLE} />
                                )}
                            </View>
                        </View>

                        {renderField('firstName', 'Name', firstName, setFirstName, 'Name of contact', 'default', 'person-outline')}
                        {renderField('surname', 'Surname', surname, setSurname, 'Surname of contact', 'default', 'people-outline')}
                        {renderField('phone', 'Phone number', phone, setPhone, 'Enter phone number', 'phone-pad', 'call-outline')}
                        {renderField('email', 'Email address', email, setEmail, 'Enter valid email address', 'email-address', 'mail-outline')}
                    </ScrollView>

                    <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleSave}>
                        <Ionicons name="person-add-outline" size={24} color="#fff" />
                        <Text style={styles.buttonText}>Save contact</Text>
                    </TouchableOpacity>
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
    field: { marginBottom: 14 },
    label: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 6, marginLeft: 4 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: INPUT_BACKGROUND,
        borderRadius: 10,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    inputIcon: { marginRight: 8 },
    input: {
        flex: 1,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        fontSize: 13,
        color: '#111',
    },
    inputFocused: { borderColor: PURPLE },
    inputError: { borderColor: '#C62828' },
    error: { color: '#C62828', fontSize: 12, marginTop: 4, marginLeft: 4 },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PURPLE,
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 30,
        gap: 16,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});