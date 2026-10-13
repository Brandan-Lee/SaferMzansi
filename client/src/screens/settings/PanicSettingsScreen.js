import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import {SafeAreaView} from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const PURPLE = '#6B21A8';
const DARK= '#2D1638';
const TEXT= '#111827';
const MUTED= '#6B7280';
const BORDER= '#D8C7E8';

const OPTIONS = [5, 10, 15, 20, 30, 60]; //seconds
export const DEFAULT_WINDOW= 15;

const label =(s) => (s < 60 ? `${s} seconds`: '1 minute');

const PanicSettingsScreen = ({ navigation, route }) => {
    const initial =route?.params?.current ?? DEFAULT_WINDOW;
    const [selected, setSelected] =useState(initial);

    const handleSave = () => {
        route?.params?.onSave?.(selected);
        Alert.alert("Saved", `Your panic cancel window is now ${label(selected)}.`, [
            {text: "OK", onPress: () => navigation?.goBack() },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
                    <Feather name="chevron-left" size={30} color={PURPLE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Panic cancel window</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                    <View style={styles.iconWrap}>
                    <Feather name="clock" size={22} color={PURPLE} style={styles.infoIcon} />
                    </View>
                    <View style={styles.infoTextWrap}>
                    <Text style={styles.infoText}>
                       After you press SOS, you have this much time to cancel before your emergency contacts are
            alerted. A shorter window sends help faster; a longer one gives you more time to cancel a
            false alarm. 
                    </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Cancel window</Text>
                {OPTIONS.map((seconds) => {
    const active = selected === seconds;
    return (
        <TouchableOpacity
            key={seconds}
            style={styles.row}
            onPress={() => setSelected(seconds)}
            activeOpacity={0.7}
        >
            <View style={styles.rowLeft}>
                <Text style={styles.rowText}>{label(seconds)}</Text>
                {seconds === DEFAULT_WINDOW && <Text style={styles.badge}>Recommended</Text>}
            </View>

            {/* Round selection button on the right */}
            <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
            </View>
        </TouchableOpacity>
    );
})}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={handleSave} activeOpacity={0.8}>
                <Feather name='save' size={20} color='#FFFFFF' />
                <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7FF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 36, height: 40, justifyContent: "center", alignItems: "flex-start" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: PURPLE },
  content: { paddingHorizontal: 22, paddingBottom: 30 },
  infoBox: {
    flexDirection: "row",
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    backgroundColor: "#F3E8FF",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  infoIconWrap: { width: 32, paddingTop: 1},
  infoTextWrap: { flex: 1},
  infoText: { fontSize: 14, color: DARK, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: TEXT, marginTop: 22, marginBottom: 5 },
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rowText: { fontSize: 17, fontWeight: "500", color: TEXT },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    color: PURPLE,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: PURPLE },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: PURPLE },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 13,
    marginHorizontal: 22,
    marginBottom: 24,
    gap: 10,
  },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
});
 
export default PanicSettingsScreen;