import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Linking,
    Platform,
    ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

const PURPLE = '#5E0A9E';
const TITLE= '#111111';
const USER_PIN= '#9B1C1C';

const DEFAULT_LOCATION = {
    latitude: -26.1076,
    longitude: 28.0567,
}

const APPROX_RADIUS_METRES= 1000;
const roundCoordinates = ({ latitude, longitude }) => ({
    latitude: Math.round(latitude * 100) / 100,
    longitude: Math.round(longitude * 100) / 100,
});

export const CATEGORIES = {
    police: {
        label: 'SAPS',
        cardTitle: 'Nearest SAPS',
        color: '#1F3BD6',
        icon: 'police-badge',
    },
    psychologist: {
        label: 'Psychologist',
        cardTitle: 'Nearest Psychologist',
        color: '#16A34A',
        icon: 'brain',
    },
    shelter: {
        label: 'Shelter',
        cardTitle: 'Nearest Shelter',
        color: '#7E22CE',
        icon: 'home-heart',
    },
    trauma: {
        label: 'Trauma Centre',
        cardTitle: 'Nearest Trauma Centre',
        color: '#F97316',
        icon: 'medical-bag',
    },
};

{/*SAMPLE DATA*/}
const SAMPLE_SERVICES = [
      { id: 's1', category: 'police', name: 'Sample Police Station', dLat: 0.012, dLng: -0.008, address: '12 Example Road', hours: 'Open 24 hours', about: 'Report a crime, open a case or request a protection order.', phone: '011 555 0101' },
    { id: 's2', category: 'police', name: 'Sample Community Police Office', dLat: -0.03, dLng: 0.025, address: '45 Sample Avenue', hours: 'Open 24 hours', about: 'Victim-friendly room available.', phone: '011 555 0102' },
    { id: 's3', category: 'psychologist', name: 'Sample Counselling Practice', dLat: -0.015, dLng: -0.02, address: '8 Demo Street, Suite 3', hours: 'Mon–Fri, 08:00–17:00', about: 'Trauma counselling and debriefing. Appointments required.', phone: '011 555 0201' },
    { id: 's4', category: 'psychologist', name: 'Sample Wellness Centre', dLat: 0.035, dLng: 0.03, address: '101 Example Drive', hours: 'Mon–Sat, 09:00–18:00', about: 'Individual and group therapy.', phone: '011 555 0202' },
    { id: 's5', category: 'shelter', name: 'Sample Safe House', dLat: 0.03, dLng: 0.02, address: 'Address shared on request', hours: 'Admissions 24 hours', about: 'Emergency accommodation for survivors of abuse and their children.', phone: '011 555 0301' },
    { id: 's6', category: 'shelter', name: 'Sample Women’s Shelter', dLat: -0.04, dLng: -0.035, address: 'Address shared on request', hours: 'Admissions 24 hours', about: 'Short-term shelter with counselling support.', phone: '011 555 0302' },
    { id: 's7', category: 'trauma', name: 'Sample Hospital Trauma Unit', dLat: -0.008, dLng: 0.018, address: '200 Demo Boulevard', hours: 'Open 24 hours', about: 'Emergency medical care and forensic examinations.', phone: '011 555 0401' },
    { id: 's8', category: 'trauma', name: 'Sample Care Centre', dLat: 0.022, dLng: -0.03, address: '77 Example Lane', hours: 'Open 24 hours', about: 'Medical, legal and counselling support in one place.', phone: '011 555 0402' },
];

{/*National Helplines*/}
const HELPLINES = [
    { name: 'SAPS emergency', phone: '10111', description: 'For emergencies and reporting crimes.' },
    { name: 'Crime Stop', phone: '08600 10111', description: 'Report crime anonymously.' },
    { name: 'Gender-Based Violence Command Centre (24 hours)', phone: '0800 428 428', description: '24/7 support for survivors of gender-based violence.' },
];

{/*Distance between two points in kilometres*/}
const distanceKm = (a, b) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`);

const callNumber = (phone, isSample) => {
    if (isSample) {
        Alert.alert(
            'Sample Data',
            `This place is sample data. In a real scenario, the app would initiate a call to ${phone}.`,
            [
                { text: 'OK', styel: 'cancel' },
            {text : 'Call 10111', onPress: () => Linking.openURL(`tel:10111`)},]
        );
        return;
    }
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
};

const openDirections = ({latitude, longitude}) => {
    const url = Platform.OS === 'ios'
        ? `maps://app?daddr=${latitude},${longitude}&om=1`
        : `google.navigation:q=${latitude},${longitude}`;
    Linking.openURL(url);
};

function ServicePin({ category, selected }) {
    const { color, icon } = CATEGORIES[category];
    return (
        <View style={styles.pinWrap}>
            <View style={[styles.pin, {backgroundColor: color}, selected && styles.pinSelected]}>
                <MaterialCommunityIcons name={icon} size={selected ? 18 : 15} color="#fff" />
        </View>
        <View style={[styles.pinPointer, {borderTopColor: color}]} />
        </View>
    );
}

export default function SupportHubScreen({ onBack, services}) {
    const mapRef = useRef(null);
    const [mode, setMode] = useState('approximate'); // 'approximate' | 'exact'
    const [rawLocation, setRawLocation] = useState(null);
    const [locationShared, setLocationShared] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hiddenCategories, setHiddenCategories] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    // Request location permission and get current location
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') {
                    const position = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    setRawLocation(position.coords);
                    setLocationShared(true);
                }
            } catch (e) {

            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const requestLocation = async (wantExact) => {
        setLoading(true);
        try {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert(
                    'Location not shared',
                    'No problem. We’ll show services around Johannesburg instead. You can turn location on in your phone settings at any time.'
                );
                setMode('approximate');
                return;
    }

    if (wantExact && Platform.OS === 'ios' && permission.ios?.accuracy === 'reduced') {
                Alert.alert(
                    'Precise location is off',
                    'Your phone is only sharing an approximate location. To share your exact location, turn on Precise Location for this app in Settings.'
                );
                setMode('approximate');
            }

           const pos = await Location.getCurrentPositionAsync({
                accuracy: wantExact ? Location.Accuracy.High : Location.Accuracy.Balanced,
            });
            setRawLocation(pos.coords);
            setLocationShared(true);
        } catch (e) {
            Alert.alert('Location unavailable', 'We couldn’t get your location. Showing Johannesburg instead.');
            setMode('approximate');
        } finally {
            setLoading(false);
        }
    };

     const chooseMode = (newMode) => {
        if (newMode === mode) return;
 
        if (newMode === 'exact') {
            Alert.alert(
                'Share exact location?',
                'Your exact location is used on this device to find the closest help. It is not shared with anyone unless you send an SOS alert.',
                [
                    { text: 'Not now', style: 'cancel' },
                    {
                        text: 'Share',
                        onPress: () => {
                            setMode('exact');
                            requestLocation(true);
                        },
                    },
                ]
            );
            return;
        }

               setMode('approximate');
        if (!locationShared) requestLocation(false);
    };

     // Exact = real position; approximate = rounded to about 1 km; no permission = default city
    const userLocation = useMemo(() => {
        if (!rawLocation) return DEFAULT_LOCATION;
        const coords = { latitude: rawLocation.latitude, longitude: rawLocation.longitude };
        return mode === 'exact' ? coords : roundCoordinates(coords);
    }, [rawLocation, mode]);
 
    // Place the sample services around the user's area
    const places = useMemo(() => {
        const list =
            services ||
            SAMPLE_SERVICES.map((s) => ({
                ...s,
                isSample: true,
                latitude: userLocation.latitude + s.dLat,
                longitude: userLocation.longitude + s.dLng,
            }));
        return list.map((p) => ({ ...p, distance: distanceKm(userLocation, p) }));
    }, [services, userLocation]);
 
    // Closest place in each category
    const nearest = useMemo(
        () =>
            Object.keys(CATEGORIES)
                .map((cat) =>
                    places
                        .filter((p) => p.category === cat)
                        .sort((a, b) => a.distance - b.distance)[0]
                )
                .filter(Boolean),
        [places]
    );
 
    // Recentre the map when the location changes
    useEffect(() => {
        mapRef.current?.animateToRegion(
            { ...userLocation, latitudeDelta: 0.12, longitudeDelta: 0.12 },
            600
        );
    }, [userLocation]);
 
    const toggleCategory = (cat) => {
        setHiddenCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };
 
    const focusPlace = (place) => {
        setSelectedId(place.id);
        mapRef.current?.animateToRegion(
            { latitude: place.latitude, longitude: place.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 },
            500
        );
    };
 
    const statusText = !locationShared
        ? 'Location not shared · showing Johannesburg'
        : mode === 'exact'
        ? 'Showing your exact location'
        : 'Showing your approximate location (about 1 km)';
 
    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="chevron-back" size={26} color={PURPLE} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Support Hub</Text>
                    </View>
 
                    {/* Map */}
                    <View style={styles.mapFrame}>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            initialRegion={{ ...userLocation, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
                            showsCompass={false}
                            toolbarEnabled={false}
                        >
                            {/* Approximate: shaded area, no exact point */}
                            {locationShared && mode === 'approximate' && (
                                <Circle
                                    center={userLocation}
                                    radius={APPROX_RADIUS_METRES}
                                    strokeColor="rgba(155, 28, 28, 0.6)"
                                    fillColor="rgba(155, 28, 28, 0.15)"
                                />
                            )}
 
                            {/* Exact: user pin */}
                            {locationShared && mode === 'exact' && (
                                <Marker coordinate={userLocation} title="You are here">
                                    <MaterialCommunityIcons name="map-marker" size={40} color={USER_PIN} />
                                </Marker>
                            )}
 
                            {places
                                .filter((p) => !hiddenCategories.includes(p.category))
                                .map((p) => (
                                    <Marker
                                        key={p.id}
                                        coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                                        title={p.name}
                                        description={`${CATEGORIES[p.category].label} · ${formatDistance(p.distance)}`}
                                        onPress={() => setSelectedId(p.id)}
                                    >
                                        <ServicePin category={p.category} selected={selectedId === p.id} />
                                    </Marker>
                                ))}
                        </MapView>
 
                        {loading && (
                            <View style={styles.mapLoading}>
                                <ActivityIndicator color={PURPLE} />
                            </View>
                        )}
                    </View>
 
                    {/* Location option */}
                    <View style={styles.segment}>
                        {['approximate', 'exact'].map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.segmentItem, mode === m && styles.segmentActive]}
                                activeOpacity={0.8}
                                onPress={() => chooseMode(m)}
                            >
                                <Ionicons
                                    name={m === 'exact' ? 'locate' : 'radio-button-on-outline'}
                                    size={16}
                                    color={mode === m ? '#fff' : PURPLE}
                                />
                                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                                    {m === 'exact' ? 'Exact location' : 'Approximate'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.status}>{statusText}</Text>
 
                    {/* Legend (tap to show or hide a category) */}
                    <Text style={styles.sectionTitle}>Legend</Text>
                    <View style={styles.legend}>
                        {Object.entries(CATEGORIES).map(([key, cat]) => {
                            const hidden = hiddenCategories.includes(key);
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.legendChip, hidden && styles.legendChipHidden]}
                                    activeOpacity={0.7}
                                    onPress={() => toggleCategory(key)}
                                >
                                    <MaterialCommunityIcons name="map-marker" size={18} color={cat.color} />
                                    <Text style={styles.legendText} numberOfLines={1}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
 
                    {/* Nearest service in each category */}
                    {nearest.map((place) => {
                        const cat = CATEGORIES[place.category];
                        const expanded = expandedId === place.id;
                        return (
                            <TouchableOpacity
                                key={place.id}
                                style={[styles.card, selectedId === place.id && styles.cardSelected]}
                                activeOpacity={0.85}
                                onPress={() => focusPlace(place)}
                            >
                                <View style={styles.cardRow}>
                                    <View style={[styles.cardIcon, { backgroundColor: cat.color }]}>
                                        <MaterialCommunityIcons name={cat.icon} size={20} color="#fff" />
                                    </View>
                                    <View style={styles.cardText}>
                                        <Text style={styles.cardTitle}>{cat.cardTitle}</Text>
                                        <Text style={styles.cardName} numberOfLines={1}>{place.name}</Text>
                                        <Text style={styles.cardDistance}>{formatDistance(place.distance)}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => setExpandedId(expanded ? null : place.id)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons
                                            name={expanded ? 'information-circle' : 'information-circle-outline'}
                                            size={28}
                                            color={TITLE}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => callNumber(place.phone, place.isSample)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="call-outline" size={26} color={TITLE} />
                                    </TouchableOpacity>
                                </View>
 
                                {expanded && (
                                    <View style={styles.details}>
                                        <DetailRow icon="location-outline" text={place.address} />
                                        <DetailRow icon="time-outline" text={place.hours} />
                                        <DetailRow icon="call-outline" text={place.phone} />
                                        <DetailRow icon="information-circle-outline" text={place.about} />
                                        {place.isSample && (
                                            <Text style={styles.sampleNote}>Sample data, not a real place.</Text>
                                        )}
                                        <TouchableOpacity
                                            style={styles.directionsButton}
                                            activeOpacity={0.8}
                                            onPress={() => openDirections(place)}
                                        >
                                            <Ionicons name="navigate-outline" size={18} color="#fff" />
                                            <Text style={styles.directionsText}>Directions</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
 
                    {/* National helplines */}
                    <Text style={styles.sectionTitle}>Helplines</Text>
                    {HELPLINES.map((h) => (
                        <TouchableOpacity
                            key={h.phone}
                            style={styles.helpline}
                            activeOpacity={0.8}
                            onPress={() => callNumber(h.phone, false)}
                        >
                            <Text style={styles.helplineName}>{h.name}</Text>
                            <View style={styles.helplineRight}>
                                <Text style={styles.helplinePhone}>{h.phone}</Text>
                                <Ionicons name="call" size={18} color={PURPLE} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}
 
function DetailRow({ icon, text }) {
    if (!text) return null;
    return (
        <View style={styles.detailRow}>
            <Ionicons name={icon} size={16} color={PURPLE} />
            <Text style={styles.detailText}>{text}</Text>
        </View>
    );
}
 
const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
        gap: 10,
    },
    title: { fontSize: 28, fontWeight: '700', color: PURPLE },
 
    mapFrame: {
        height: 300,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: PURPLE,
        overflow: 'hidden',
    },
    map: { flex: 1 },
    mapLoading: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
 
    pinWrap: { alignItems: 'center' },
    pin: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    pinSelected: { width: 38, height: 38, borderRadius: 19, borderWidth: 3 },
    pinPointer: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -1,
    },
 
    segment: {
        flexDirection: 'row',
        backgroundColor: '#F3EBFB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: PURPLE,
        padding: 3,
        marginTop: 14,
    },
    segmentItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    segmentActive: { backgroundColor: PURPLE },
    segmentText: { color: PURPLE, fontWeight: '600', fontSize: 14 },
    segmentTextActive: { color: '#fff' },
    status: { fontSize: 12, color: '#555', marginTop: 6, marginLeft: 2 },
 
    sectionTitle: { fontSize: 16, fontWeight: '700', color: TITLE, marginTop: 20, marginBottom: 10 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
    legendChip: {
        width: '48.5%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3EBFB',
        borderWidth: 1,
        borderColor: PURPLE,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 8,
        gap: 4,
    },
    legendChipHidden: { opacity: 0.4 },
    legendText: { flex: 1, fontSize: 12, fontWeight: '600', color: TITLE },
 
    card: {
        backgroundColor: '#F3EBFB',
        borderWidth: 1,
        borderColor: PURPLE,
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
    },
    cardSelected: { borderWidth: 2 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: TITLE },
    cardName: { fontSize: 13, color: '#333' },
    cardDistance: { fontSize: 13, color: '#555' },
    iconButton: { marginLeft: 10 },
 
    details: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#D9C6EE',
        gap: 8,
    },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    detailText: { flex: 1, fontSize: 13, color: '#222', lineHeight: 18 },
    sampleNote: { fontSize: 12, fontStyle: 'italic', color: '#8A4B00' },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        backgroundColor: PURPLE,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        gap: 6,
        marginTop: 4,
    },
    directionsText: { color: '#fff', fontWeight: '600' },
 
    helpline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    helplineName: { flex: 1, fontSize: 14, color: TITLE },
    helplineRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    helplinePhone: { fontSize: 14, fontWeight: '700', color: PURPLE },
});
 
