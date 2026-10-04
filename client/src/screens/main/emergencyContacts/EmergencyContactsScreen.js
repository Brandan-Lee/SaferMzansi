import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#5E0A9E';
const CARD = '#CDBBE0';
const AVATAR_BACKGROUND = '#EFE3FA';

// Set to false to start with an empty list (e.g. once real data is saved in the database)
export const USE_MOCK_DATA = true;

// Mock data
export const MOCK_CONTACTS = [
    { id: 'mock-1', firstName: 'Beatrice', surname: 'Sanders', name: 'Beatrice Sanders', phone: '0641234567', email: 'beetroot657@gmail.com' },
    { id: 'mock-2', firstName: 'Shawn', surname: 'Mbadawe', name: 'Shawn Mbadawe', phone: '0827654321', email: 'shawnbytheway36@gmail.com' },
    { id: 'mock-3', firstName: 'Maya', surname: 'Hoore', name: 'Maya Hoore', phone: '0712468210', email: 'mayahee@gmail.com' },
    { id: 'mock-4', firstName: 'Jacques', surname: 'van Tonder', name: 'Jacques van Tonder', phone: '0615550123', email: 'jacquesvantond@gmail.com' },
];

function EmergencyContactsScreen({ contacts = [], onAddPress, navigation, onContactPress }) {
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onContactPress && onContactPress(item)}
        >
            <View style={styles.avatar}>
                <Ionicons name="person-outline" size={18} color={PURPLE} />
            </View>
            <View style={styles.cardText}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.info} numberOfLines={1}>
                    {item.phone || item.email || 'Contact Information'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#222" />
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="chevron-back" size={24} color={PURPLE} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Emergency contacts</Text>
                </View>

                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No emergency contacts added yet.</Text>
                    }
                />

                <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onAddPress}>
                    <Ionicons name="person-add-outline" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Add contact</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 28,
        gap: 10,
    },
    title: { fontSize: 22, fontWeight: '700', color: PURPLE },
    list: { gap: 12, paddingBottom: 20 },
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
        marginBottom: 30,
        gap: 16,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default EmergencyContactsScreen;