import React, { useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';

const PURPLE = '#5E0A9E';
const RED = '#EF4444';
const BACKGROUND= '#FFF5F5';
const TITLE = '#1F2937';
const BODY = '#6B7280';
const PANIC_WINDOW = 15;

const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function SOSScreen({ 
    onCancel, 
    onTimerEnd,
    onClose,
duration = PANIC_WINDOW,
}) {
    const [secondsLeft, setSecondsLeft] = useState(duration);
    const [alertSent, setAlertSent] = useState(false);
    const pulse = useRef(new Animated.Value(1)).current;
    const intervalRef = useRef(null);

    {/* Start the countdown timer when the component mounts */}
    useEffect(() => {
const endTime = Date.now() + duration * 1000;
        Vibration.vibrate(400);
 
        intervalRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            setSecondsLeft(remaining);
 
            if (remaining === 0) {
                clearInterval(intervalRef.current);
                setAlertSent(true);
                Vibration.vibrate([0, 300, 150, 300]);
                if (onTimerEnd) onTimerEnd();
            }
        }, 250);

        return () => clearInterval(intervalRef.current);
    }, []);

    {/*Alarm icon pulsing whilr timer is running*/}
    useEffect(() => {
        if (alertSent) {
            pulse.setValue(1);
            return;
        }
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.5,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [alertSent]);

    const handleCancel = () => {
        clearInterval(intervalRef.current);
        Vibration.cancel();
        if (onCancel) onCancel();
    };

    const handleClose = () => {
        if (onClose) onClose();
        else if (onCancel) onCancel();
    };

    return (
        <LinearGradient colors={['#D9D9D9', '#DCCBF3']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
            <View style={styles.inner}>
            <View style={styles.content}>
                <Animated.View style ={{ transform: [{ scale: pulse }] }}>
                    <MaterialCommunityIcons name="alarm-light" size={64} color={RED} />
                </Animated.View>

                <Text style={styles.title}>Emergency SOS</Text>

                {alertSent ? (
                    <>
                    <Text style={styles.message}>Your emergency alert has been sent.</Text>
                    <Text style={styles.subMessage}>Your emergency contacts have been notified and your location has been shared.</Text>
                    </>
                ) : (
                    <>
                    <Text style={styles.message}>You have activated the emergency alert.</Text>
                    <Text style={styles.subMessage}>Your emergency contacts will be notified and your location will be shared.</Text>
                    </>
                )}

                <View style = {styles.card}>
                    <View style={styles.cardItem}>
                        <Ionicons name="location-outline" size={22} color={TITLE} />
                        <Text style={styles.cardText}>Share current location</Text>
                        </View>

                        <View style={styles.cardItem}>
                            <MaterialCommunityIcons name="bell-alert-outline" size={24} color={TITLE} />
                            <Text style={styles.cardText}>Notify emergency contacts</Text>
                            </View>

                            <View style={[styles.cardItem, styles.timerItem]}>
                                <MaterialCommunityIcons name="shield-alert-outline" size={22} color={TITLE} />
                                <View style={[styles.timerBox, alertSent && styles.timerBoxSent]}>
                                    {alertSent ? (
                                        <Ionicons name ="checkmark" size={24} color={BACKGROUND} />
                                    ) : (
                                        <Text style={[styles.timerText, secondsLeft <= 5 && styles.timerUrgent]}>
                                            {formatTime(secondsLeft)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                        </View>

                        {alertSent ? (
                            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleClose}>
                                <Ionicons name="checkmark-circle-outline" size={24} color={BACKGROUND} />
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                        ) : (

                            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleCancel}>
                                <Ionicons name="close-circle-outline" size={24} color={BACKGROUND} />
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        </View>
                        </SafeAreaView>
                        </LinearGradient>
                        );
                        
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND,
        paddinghorizontal: 32,
    },
    safe: {
        flex: 1,
    },
    inner: {
        flex: 1,
        paddingHorizontal: 32,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 70,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: TITLE,
        marginTop: 16,
        marginBottom: 32,
    },
    message: {
        fontSize: 15,
        color: BODY,
        textAlign: 'center',
        marginBottom: 32,
    },
    subMessage: {
        fontSize: 15,
        color: BODY,
        lineHeight: 22,
        alignSelf: 'stretch',
        marginBottom: 60,
    },
    card: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignSelf: 'stretch',
        borderWidth: 1,
        borderColor: '#CDBBE0',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        gap: 10,
    },
    cardItem: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    cardText: {
        fontSize: 14,
        color: TITLE,
        lineHeight: 20,
        alignSelf: 'flex-start',
    },
    timerItem: {
        justifyContent: 'flex-start',
    },
    timerBox: {
        backgroundColor: '#D9D9D9',
        paddingVertical: 10,
        paddingHorizontal: 12,
        minWidth: 80,
        alignItems: 'center',
        marginTop: 8,
    },
    timerBoxSent: {
        backgroundColor: '#2E7D32',
    },
    timerText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        fontVariant: ['tabular-nums'],
    },
    timerUrgent: {
        color: RED,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PURPLE,
        borderRadius: 10,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginBottom: 32,
        gap: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '600',
    },
});

                               