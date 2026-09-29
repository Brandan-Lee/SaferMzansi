import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';

const PURPLE = '#5E0A9E';
const CARD = '#CDBBE0';
const AVATAR_BACKGROUND = '#EFE3FA';

export default function EmergencyContactsScreen ({ contacts, onAddPress, onBack, onDelete }) {
    const handleContactpress = (contact) => {
        const buttons =[];
        if (contact.phone) {
            buttons.push({ text : 'Call', onPress: () => Linking.openURL (`tel:${contact.phone}`) });
        }
        if (contact.email) {
            buttons.push({ text: 'Email', onPress: () => Linking.openURL (`mailto:${contact.email}`)});
        }
        buttons.push({ 
            text: 'Delete',
            style: 'destructive',
            onPress: () =>
                Alert.alert( 'Delete Contact', `Remove ${contact.name}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete(contact.id) },
                ])
        });
        buttons.push({ text: 'Close', style: 'cancel' });
        Alert.alert(
            contact.name,
            [contact.phone,contact.email].filter(Boolean).join('\n'),
            'No contact information available.',
            buttons
        );
        
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleContactpress(item)}
            >
                <View style={styles.avatar}>
                <Ionicons name="person-outline" size={18} color={PURPLE} />
                </View>
                <View style={styles.cardText}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.info} numberOfLines={1}>
                        {item.phone || item.email || 'No contact information available.'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={PURPLE} />
            </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="chevron-back" size={24} color={PURPLE} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Emergency Contacts</Text>
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
                    <Text style={styles.buttonText}>Add Contact</Text>
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
        paddingHorizontal: 24},
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
    name: { fontSize: 16, fontWeight: '600', color: "#111" },
    info: { fontSize: 14, color: "#222" },
    empty: {textAlign: 'center', color: "#555", fontSize: 16, marginTop: 40 },
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