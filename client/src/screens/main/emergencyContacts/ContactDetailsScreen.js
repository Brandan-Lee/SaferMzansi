import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#5E0A9E';
const RED = '#C62828';

export default function ContactDetailsScreen({ contact, onBack, onDelete }) {
    if (!contact) {
        return (
            <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
                <SafeAreaView style={styles.safe}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="chevron-back" size={24} color={PURPLE} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Contact details</Text>
                    </View>
                    <Text style={styles.empty}>Contact not found.</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // Older contacts may only have a full name, so split it if needed
    const [fallbackFirst, ...rest] = (contact.name || '').split(' ');
    const firstName = contact.firstName || fallbackFirst || '';
    const surname = contact.surname || rest.join(' ');
    const fullName = contact.name || `${firstName} ${surname}`.trim();

    const initials = [firstName, surname]
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .join('');

    const handleCall = () => {
        if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
    };

    const handleEmail = () => {
        if (contact.email) Linking.openURL(`mailto:${contact.email}`);
    };

    const handleDelete = () => {
        Alert.alert('Delete contact', `Remove ${fullName} from your emergency contacts?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => onDelete && onDelete(contact.id),
            },
        ]);
    };

    const renderRow = (icon, label, value) => (
        <View style={styles.row}>
            <View style={styles.rowIcon}>
                <Ionicons name={icon} size={18} color={PURPLE} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={[styles.rowValue, !value && styles.rowValueEmpty]} numberOfLines={1}>
                    {value || 'Not provided'}
                </Text>
            </View>
        </View>
    );

    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="chevron-back" size={24} color={PURPLE} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Contact details</Text>
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
                    <Text style={styles.fullName}>{fullName}</Text>

                    {renderRow('person-outline', 'Name', firstName)}
                    {renderRow('people-outline', 'Surname', surname)}
                    {renderRow('call-outline', 'Phone number', contact.phone)}
                    {renderRow('mail-outline', 'Email address', contact.email)}
                </ScrollView>

                <View style={styles.actions}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.primaryButton, !contact.phone && styles.disabled]}
                            activeOpacity={0.8}
                            onPress={handleCall}
                            disabled={!contact.phone}
                        >
                            <Ionicons name="call-outline" size={20} color="#fff" />
                            <Text style={styles.primaryText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.secondaryButton, !contact.email && styles.disabled]}
                            activeOpacity={0.8}
                            onPress={handleEmail}
                            disabled={!contact.email}
                        >
                            <Ionicons name="mail-outline" size={20} color={PURPLE} />
                            <Text style={styles.secondaryText}>Email</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={18} color={RED} />
                        <Text style={styles.deleteText}>Delete contact</Text>
                    </TouchableOpacity>
                </View>
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
    empty: { textAlign: 'center', color: '#555', fontSize: 16, marginTop: 40 },
    avatarFrame: {
        alignSelf: 'center',
        padding: 2,
        marginTop: 8,
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
    fullName: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        marginTop: 10,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EFE3FA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowLabel: { fontSize: 12, color: '#666' },
    rowValue: { fontSize: 15, fontWeight: '600', color: '#111' },
    rowValueEmpty: { color: '#999', fontWeight: '400', fontStyle: 'italic' },
    actions: { marginBottom: 20 },
    actionRow: { flexDirection: 'row', gap: 12 },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PURPLE,
        borderRadius: 8,
        paddingVertical: 12,
        gap: 8,
    },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: PURPLE,
        borderRadius: 8,
        paddingVertical: 12,
        gap: 8,
    },
    secondaryText: { color: PURPLE, fontSize: 16, fontWeight: '600' },
    disabled: { opacity: 0.4 },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    deleteText: { color: RED, fontSize: 15, fontWeight: '600' },
});