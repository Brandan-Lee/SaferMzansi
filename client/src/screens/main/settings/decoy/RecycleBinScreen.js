import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    View,
    Text

} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/FontAwesome';

const RecycleBinScreen = () => {
    const navigation = useNavigation();



    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name='arrow-left' size={23} color="#6b21a8" />
                </Pressable>
                <Text style={styles.headerTitle}>Recycle Bin </Text>
                <View style={styles.headerSpacer} />

            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.intro}>
                    <View style={styles.iconBadge}>
                        <Icon name="trash-o" size={28} color="#6b21a8" />
                    </View>

                    <Text style={styles.title}> Recently Deleted</Text>
                    <Text style={styles.subtitle}>
                        Evidence you remove from your vault appears here.
                        You can restore an item or choose to delete it permanently.

                    </Text>

                </View>

                <View style={styles.emptyCard}>
                    <Icon name="trash-o" size={42} color="#9ca3af" />
                    <Text style={styles.emptyTitle}>Your Recycle Bin is empty</Text>
                    <Text style={styles.emptyText}>Deleted evidence will appear here</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FaF7FF"
    },
    header: {
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,

    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: '#6B21A8'
    },
    headerSpacer: {
        width: 40,
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 32,
    },
    intro: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconBadge: {
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: '#f0e4fa',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#6b21a8',
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: '#6b7280',
        textAlign: 'center',
    },
    emptyCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e9e1f0',
        paddingVertical: 38,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 14,
        marginBottom: 7,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});


export default RecycleBinScreen;