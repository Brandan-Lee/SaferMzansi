import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocalEmergencyContacts } from '../../../database/repositories/contactRepository';
import { useAuth } from '@context/AuthContext'; // 1. Import useAuth

const PURPLE = '#5E0A9E';
const CARD = '#CDBBE0';
const AVATAR_BACKGROUND = '#EFE3FA';

export default function EmergencyContactsScreen({ navigation }) {
    const db = useSQLiteContext();
    const route = useRoute();
    const { user } = useAuth(); // 2. Get user object from context

    // 3. Resolve userId from params or authenticated user session
    const userId = route.params?.userId || user?.userId;

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadContacts = useCallback(async () => {
        if (!db || !userId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const localContacts = await getLocalEmergencyContacts(db, userId);
            setContacts(localContacts);
        } catch (error) {
            console.error('Failed to load emergency contacts:', error);
        } finally {
            setLoading(false);
        }
    }, [db, userId]);

    useFocusEffect(
        useCallback(() => {
            loadContacts();
        }, [loadContacts])
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ContactDetailsScreen', { contact: item, userId })}
        >
            <View style={styles.avatar}>
                <Ionicons name="person-outline" size={18} color={PURPLE} />
            </View>
            <View style={styles.cardText}>
                <Text style={styles.name} numberOfLines={1}>
                    {item.name || `${item.firstName || ''} ${item.surname || ''}`.trim() || 'Unnamed Contact'}
                </Text>
                <Text style={styles.info} numberOfLines={1}>
                    {item.phone || item.email || 'No contact info'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#222" />
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color={PURPLE} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Emergency contacts</Text>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={PURPLE} />
                    </View>
                ) : (
                    <FlatList
                        data={contacts}
                        keyExtractor={(item, index) => item.contact_id?.toString() || item.id?.toString() || index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.empty}>No emergency contacts added yet.</Text>
                        }
                    />
                )}

                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('AddContactScreen', { userId })}
                >
                    <Ionicons name="person-add-outline" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Add contact</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: 24 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 20,
        gap: 10,
    },
    title: { fontSize: 22, fontWeight: '700', color: PURPLE },
    list: { gap: 12, paddingBottom: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: AVATAR_BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardText: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: '#111' },
    info: { fontSize: 12, color: '#222' },
    empty: { textAlign: 'center', color: '#555', fontSize: 16, marginTop: 40 },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PURPLE,
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 20,
        gap: 12,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});